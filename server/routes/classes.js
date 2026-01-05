import express from 'express';
import { getDatabase } from '../db/database.js';
import { authenticateToken } from './auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Get all classes for teacher
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const classes = db.prepare(`
      SELECT c.*, 
             COUNT(s.id) as student_count,
             SUM(CASE WHEN s.has_voted = 1 THEN 1 ELSE 0 END) as voted_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      WHERE c.teacher_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    res.json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single class
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const classItem = db.prepare(`
      SELECT * FROM classes WHERE id = ? AND teacher_id = ?
    `).get(req.params.id, req.user.id);

    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const students = db.prepare(`
      SELECT * FROM students WHERE class_id = ? ORDER BY name
    `).all(req.params.id);

    res.json({ ...classItem, students });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create class
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, grade } = req.body;
    const db = getDatabase();
    const id = randomUUID();
    const sessionId = randomUUID();

    db.prepare(`
      INSERT INTO classes (id, name, grade, teacher_id, session_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, grade, req.user.id, sessionId);

    res.json({ id, name, grade, sessionId, votingOpen: false });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, grade } = req.body;
    const db = getDatabase();

    db.prepare(`
      UPDATE classes 
      SET name = ?, grade = ?, updated_at = strftime('%s', 'now')
      WHERE id = ? AND teacher_id = ?
    `).run(name, grade, req.params.id, req.user.id);

    res.json({ message: 'Class updated' });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM classes WHERE id = ? AND teacher_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Class deleted' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle voting
router.post('/:id/toggle-voting', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const classItem = db.prepare('SELECT voting_open FROM classes WHERE id = ? AND teacher_id = ?').get(req.params.id, req.user.id);
    
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const newStatus = classItem.voting_open === 1 ? 0 : 1;
    db.prepare('UPDATE classes SET voting_open = ? WHERE id = ?').run(newStatus, req.params.id);

    res.json({ votingOpen: newStatus === 1 });
  } catch (error) {
    console.error('Toggle voting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;









