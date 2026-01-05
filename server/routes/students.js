import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';
import { authenticateToken } from './auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Get students for a class
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const students = db.prepare(`
      SELECT * FROM students 
      WHERE class_id = ? 
      ORDER BY name
    `).all(req.params.classId);

    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add student
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { classId, name, pin } = req.body;
    const db = getDatabase();

    // Verify class belongs to teacher
    const classItem = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, req.user.id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const id = randomUUID();
    let pinHash = null;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    db.prepare(`
      INSERT INTO students (id, class_id, name, pin_hash)
      VALUES (?, ?, ?, ?)
    `).run(id, classId, name, pinHash);

    res.json({ id, name, hasVoted: false });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk add students (from CSV)
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { classId, students } = req.body;
    const db = getDatabase();

    // Verify class belongs to teacher
    const classItem = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, req.user.id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const inserted = [];
    const stmt = db.prepare(`
      INSERT INTO students (id, class_id, name, pin_hash)
      VALUES (?, ?, ?, ?)
    `);

    for (const student of students) {
      const id = randomUUID();
      stmt.run(id, classId, student.name, null);
      inserted.push({ id, name: student.name, hasVoted: false });
    }

    res.json({ count: inserted.length, students: inserted });
  } catch (error) {
    console.error('Bulk add students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, pin } = req.body;
    const db = getDatabase();

    // Verify student belongs to teacher's class
    const student = db.prepare(`
      SELECT s.* FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ? AND c.teacher_id = ?
    `).get(req.params.id, req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let pinHash = student.pin_hash;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    db.prepare(`
      UPDATE students 
      SET name = ?, pin_hash = ?
      WHERE id = ?
    `).run(name, pinHash, req.params.id);

    res.json({ message: 'Student updated' });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Verify student belongs to teacher's class
    const student = db.prepare(`
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ? AND c.teacher_id = ?
    `).get(req.params.id, req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify student PIN
router.post('/:id/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const db = getDatabase();
    
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.pin_hash) {
      return res.json({ verified: true }); // No PIN set
    }

    const verified = await bcrypt.compare(pin, student.pin_hash);
    res.json({ verified });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset student votes
router.post('/class/:classId/reset-votes', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Verify class belongs to teacher
    const classItem = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(req.params.classId, req.user.id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    db.prepare('UPDATE students SET has_voted = 0 WHERE class_id = ?').run(req.params.classId);
    db.prepare('DELETE FROM votes WHERE class_id = ?').run(req.params.classId);

    res.json({ message: 'Votes reset' });
  } catch (error) {
    console.error('Reset votes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;









