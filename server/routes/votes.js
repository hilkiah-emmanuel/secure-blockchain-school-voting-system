import express from 'express';
import { getDatabase } from '../db/database.js';
import { recordVoteOnBlockchain } from '../blockchain/blockchain.js';
import { broadcastToClass } from '../websocket/websocket.js';
import { authenticateToken } from './auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Submit vote
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { classId, studentId, positionId, candidateId, rankedOrder } = req.body;
    const db = getDatabase();

    // Verify student exists and hasn't voted for this position
    const student = db.prepare('SELECT * FROM students WHERE id = ? AND class_id = ?').get(studentId, classId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if already voted for this position (for single-choice)
    const existingVote = db.prepare(`
      SELECT id FROM votes 
      WHERE student_id = ? AND position_id = ? AND class_id = ?
    `).get(studentId, positionId, classId);

    if (existingVote) {
      return res.status(400).json({ error: 'Already voted for this position' });
    }

    // Record vote on blockchain
    const timestamp = Math.floor(Date.now() / 1000);
    const blockchainResult = await recordVoteOnBlockchain(
      classId,
      studentId,
      positionId,
      candidateId,
      timestamp
    );

    // Save vote to database
    const voteId = randomUUID();
    db.prepare(`
      INSERT INTO votes (id, class_id, student_id, position_id, candidate_id, timestamp, transaction_hash, block_number, ranked_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      voteId,
      classId,
      studentId,
      positionId,
      candidateId,
      timestamp,
      blockchainResult.transactionHash,
      blockchainResult.blockNumber,
      rankedOrder || null
    );

    // Mark student as voted if all positions are voted
    const totalPositions = db.prepare(`
      SELECT COUNT(*) as count FROM positions p
      JOIN elections e ON p.election_id = e.id
      JOIN classes c ON c.id = ?
      WHERE e.status = 'active'
    `).get(classId);

    const studentVotes = db.prepare(`
      SELECT COUNT(DISTINCT position_id) as count FROM votes WHERE student_id = ? AND class_id = ?
    `).get(studentId, classId);

    if (studentVotes.count >= totalPositions.count) {
      db.prepare('UPDATE students SET has_voted = 1 WHERE id = ?').run(studentId);
    }

    // Broadcast update via WebSocket
    broadcastToClass(classId, {
      type: 'vote_submitted',
      payload: {
        studentId,
        positionId,
        candidateId,
        timestamp
      }
    });

    res.json({
      success: true,
      voteId,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber
    });
  } catch (error) {
    console.error('Submit vote error:', error);
    
    // Queue vote for retry if blockchain fails
    const { classId, studentId, positionId, candidateId, rankedOrder } = req.body;
    const db = getDatabase();
    const queueId = randomUUID();
    
    db.prepare(`
      INSERT INTO vote_queue (id, class_id, student_id, position_id, candidate_id, timestamp, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(queueId, classId, studentId, positionId, candidateId, Math.floor(Date.now() / 1000));

    res.status(500).json({ 
      error: 'Failed to submit vote, queued for retry',
      queued: true,
      queueId
    });
  }
});

// Get vote queue (for retry processing)
router.get('/queue', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const queue = db.prepare(`
      SELECT * FROM vote_queue 
      WHERE status = 'pending' 
      ORDER BY created_at ASC
      LIMIT 100
    `).all();

    res.json({ queue });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retry queued votes
router.post('/retry-queue', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const queue = db.prepare(`
      SELECT * FROM vote_queue 
      WHERE status = 'pending' AND retry_count < 5
      ORDER BY created_at ASC
      LIMIT 50
    `).all();

    const results = [];
    for (const queuedVote of queue) {
      try {
        const timestamp = queuedVote.timestamp || Math.floor(Date.now() / 1000);
        const blockchainResult = await recordVoteOnBlockchain(
          queuedVote.class_id,
          queuedVote.student_id,
          queuedVote.position_id,
          queuedVote.candidate_id,
          timestamp
        );

        if (blockchainResult.success) {
          // Move from queue to votes
          const voteId = randomUUID();
          db.prepare(`
            INSERT INTO votes (id, class_id, student_id, position_id, candidate_id, timestamp, transaction_hash, block_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            voteId,
            queuedVote.class_id,
            queuedVote.student_id,
            queuedVote.position_id,
            queuedVote.candidate_id,
            timestamp,
            blockchainResult.transactionHash,
            blockchainResult.blockNumber
          );

          // Delete from queue
          db.prepare('DELETE FROM vote_queue WHERE id = ?').run(queuedVote.id);
          results.push({ id: queuedVote.id, status: 'success' });
        } else {
          // Increment retry count
          db.prepare(`
            UPDATE vote_queue 
            SET retry_count = retry_count + 1 
            WHERE id = ?
          `).run(queuedVote.id);
          results.push({ id: queuedVote.id, status: 'failed', retry: true });
        }
      } catch (error) {
        db.prepare(`
          UPDATE vote_queue 
          SET retry_count = retry_count + 1,
              status = CASE WHEN retry_count >= 4 THEN 'failed' ELSE 'pending' END
          WHERE id = ?
        `).run(queuedVote.id);
        results.push({ id: queuedVote.id, status: 'error', error: error.message });
      }
    }

    res.json({ processed: results.length, results });
  } catch (error) {
    console.error('Retry queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;









