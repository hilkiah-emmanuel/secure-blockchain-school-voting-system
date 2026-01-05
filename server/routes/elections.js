import express from 'express';
import { getDatabase } from '../db/database.js';
import { authenticateToken } from './auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Get all elections
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const elections = db.prepare(`
      SELECT e.*, 
             COUNT(DISTINCT p.id) as position_count,
             COUNT(DISTINCT c.id) as candidate_count
      FROM elections e
      LEFT JOIN positions p ON p.election_id = e.id
      LEFT JOIN candidates c ON c.position_id = p.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `).all();

    // Get positions and candidates for each election
    for (const election of elections) {
      const positions = db.prepare(`
        SELECT p.*, 
               COUNT(c.id) as candidate_count
        FROM positions p
        LEFT JOIN candidates c ON c.position_id = p.id
        WHERE p.election_id = ?
        GROUP BY p.id
        ORDER BY p.created_at
      `).all(election.id);

      for (const position of positions) {
        const candidates = db.prepare(`
          SELECT * FROM candidates 
          WHERE position_id = ? 
          ORDER BY name
        `).all(position.id);
        position.candidates = candidates;
      }

      election.positions = positions;
    }

    res.json({ elections });
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single election
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const positions = db.prepare(`
      SELECT * FROM positions WHERE election_id = ? ORDER BY created_at
    `).all(req.params.id);

    for (const position of positions) {
      const candidates = db.prepare(`
        SELECT * FROM candidates WHERE position_id = ? ORDER BY name
      `).all(position.id);
      position.candidates = candidates;
    }

    election.positions = positions;
    res.json(election);
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create election
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;
    const db = getDatabase();
    const id = randomUUID();

    db.prepare(`
      INSERT INTO elections (id, name, description, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, description, startDate, endDate, status || 'draft');

    res.json({ id, name, description, startDate, endDate, status: status || 'draft', positions: [] });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update election
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;
    const db = getDatabase();

    db.prepare(`
      UPDATE elections 
      SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(name, description, startDate, endDate, status, req.params.id);

    res.json({ message: 'Election updated' });
  } catch (error) {
    console.error('Update election error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete election
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM elections WHERE id = ?').run(req.params.id);
    res.json({ message: 'Election deleted' });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add position
router.post('/:id/positions', authenticateToken, async (req, res) => {
  try {
    const { title, type } = req.body;
    const db = getDatabase();
    const positionId = randomUUID();

    db.prepare(`
      INSERT INTO positions (id, election_id, title, type)
      VALUES (?, ?, ?, ?)
    `).run(positionId, req.params.id, title, type || 'single');

    res.json({ id: positionId, title, type: type || 'single', candidates: [] });
  } catch (error) {
    console.error('Add position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update position
router.put('/positions/:positionId', authenticateToken, async (req, res) => {
  try {
    const { title, type } = req.body;
    const db = getDatabase();

    db.prepare(`
      UPDATE positions 
      SET title = ?, type = ?
      WHERE id = ?
    `).run(title, type, req.params.positionId);

    res.json({ message: 'Position updated' });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete position
router.delete('/positions/:positionId', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM positions WHERE id = ?').run(req.params.positionId);
    res.json({ message: 'Position deleted' });
  } catch (error) {
    console.error('Delete position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add candidate
router.post('/positions/:positionId/candidates', authenticateToken, async (req, res) => {
  try {
    const { name, photoUrl, profile, manifesto, motto, classId } = req.body;
    const db = getDatabase();
    const candidateId = randomUUID();
    // If user is admin, candidate is auto-approved. If teacher, candidate is pending approval.
    const approved = req.user && req.user.isAdmin ? 1 : 0;

    db.prepare(`
      INSERT INTO candidates (id, position_id, name, photo_url, profile, manifesto, motto, class_id, approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateId,
      req.params.positionId,
      name,
      photoUrl || null,
      profile || null,
      manifesto || null,
      motto || null,
      classId || null,
      approved
    );

    res.json({ 
      id: candidateId, 
      name, 
      photoUrl: photoUrl || null,
      profile: profile || null,
      manifesto: manifesto || null,
      motto: motto || null,
      classId: classId || null,
      approved
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update candidate
router.put('/candidates/:candidateId', authenticateToken, async (req, res) => {
  try {
    const { name, photoUrl, profile, manifesto, motto, approved, classId } = req.body;
    const db = getDatabase();

    db.prepare(`
      UPDATE candidates 
      SET name = ?, photo_url = ?, profile = ?, manifesto = ?, motto = ?, class_id = COALESCE(?, class_id), approved = COALESCE(?, approved)
      WHERE id = ?
    `).run(name, photoUrl || null, profile || null, manifesto || null, motto || null, classId || null, typeof approved === 'number' ? approved : null, req.params.candidateId);

    res.json({ message: 'Candidate updated' });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete candidate
router.delete('/candidates/:candidateId', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.candidateId);
    res.json({ message: 'Candidate deleted' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;







