import express from 'express';
import { getDatabase } from '../db/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get results for a class
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get all positions for active elections
    const positions = db.prepare(`
      SELECT p.*, e.name as election_name
      FROM positions p
      JOIN elections e ON p.election_id = e.id
      WHERE e.status = 'active'
      ORDER BY p.created_at
    `).all();

    const results = {};
    
    for (const position of positions) {
      // Get vote counts per candidate
      const voteCounts = db.prepare(`
        SELECT 
          c.id as candidate_id,
          c.name as candidate_name,
          COUNT(v.id) as vote_count,
          COUNT(DISTINCT v.student_id) as unique_voters
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id AND v.position_id = ? AND v.class_id = ?
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC
      `).all(position.id, req.params.classId, position.id);

      // Get total votes for this position
      const totalVotes = db.prepare(`
        SELECT COUNT(DISTINCT student_id) as count
        FROM votes
        WHERE position_id = ? AND class_id = ?
      `).get(position.id, req.params.classId);

      results[position.id] = {
        position: {
          id: position.id,
          title: position.title,
          type: position.type,
          electionName: position.election_name
        },
        candidates: voteCounts.map(vc => ({
          candidateId: vc.candidate_id,
          candidateName: vc.candidate_name,
          voteCount: vc.vote_count || 0,
          uniqueVoters: vc.unique_voters || 0
        })),
        totalVotes: totalVotes?.count || 0
      };
    }

    res.json({ results });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export results as CSV
router.get('/class/:classId/export/csv', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    const positions = db.prepare(`
      SELECT p.*, e.name as election_name
      FROM positions p
      JOIN elections e ON p.election_id = e.id
      WHERE e.status = 'active'
      ORDER BY p.created_at
    `).all();

    let csv = 'Position,Candidate,Votes,Percentage\n';

    for (const position of positions) {
      const voteCounts = db.prepare(`
        SELECT 
          c.name as candidate_name,
          COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id AND v.position_id = ? AND v.class_id = ?
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC
      `).all(position.id, req.params.classId, position.id);

      const totalVotes = voteCounts.reduce((sum, vc) => sum + (vc.vote_count || 0), 0);

      for (const vc of voteCounts) {
        const percentage = totalVotes > 0 ? ((vc.vote_count || 0) / totalVotes * 100).toFixed(2) : '0.00';
        csv += `"${position.title}","${vc.candidate_name}",${vc.vote_count || 0},${percentage}%\n`;
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="election-results-${req.params.classId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export results as JSON
router.get('/class/:classId/export/json', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    const classItem = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.classId);
    const positions = db.prepare(`
      SELECT p.*, e.name as election_name
      FROM positions p
      JOIN elections e ON p.election_id = e.id
      WHERE e.status = 'active'
      ORDER BY p.created_at
    `).all();

    const exportData = {
      classId: req.params.classId,
      className: classItem?.name || 'Unknown',
      exportDate: new Date().toISOString(),
      positions: []
    };

    for (const position of positions) {
      const voteCounts = db.prepare(`
        SELECT 
          c.id as candidate_id,
          c.name as candidate_name,
          COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id AND v.position_id = ? AND v.class_id = ?
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC
      `).all(position.id, req.params.classId, position.id);

      const totalVotes = voteCounts.reduce((sum, vc) => sum + (vc.vote_count || 0), 0);

      exportData.positions.push({
        positionId: position.id,
        title: position.title,
        type: position.type,
        totalVotes,
        candidates: voteCounts.map(vc => ({
          candidateId: vc.candidate_id,
          name: vc.candidate_name,
          votes: vc.vote_count || 0,
          percentage: totalVotes > 0 ? ((vc.vote_count || 0) / totalVotes * 100).toFixed(2) : '0.00'
        }))
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="election-results-${req.params.classId}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;









