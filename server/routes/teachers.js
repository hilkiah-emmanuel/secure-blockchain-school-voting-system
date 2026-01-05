import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';
import { authenticateToken } from './auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Get all teachers (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const db = getDatabase();
    const teachers = db.prepare(`
      SELECT id, email, name, two_factor_enabled, created_at
      FROM teachers
      ORDER BY created_at DESC
    `).all();

    res.json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single teacher
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const db = getDatabase();
    const teacher = db.prepare(`
      SELECT id, email, name, two_factor_enabled, created_at
      FROM teachers
      WHERE id = ?
    `).get(req.params.id);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create teacher (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, name } = req.body;
    const db = getDatabase();

    // Check if email exists
    const existing = db.prepare('SELECT id FROM teachers WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    db.prepare(`
      INSERT INTO teachers (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(id, email, passwordHash, name);

    res.json({ 
      id, 
      email, 
      name,
      message: 'Teacher created successfully' 
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update teacher
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, password } = req.body;
    const db = getDatabase();

    // Check if email is being changed and if it's available
    if (email) {
      const existing = db.prepare('SELECT id FROM teachers WHERE email = ? AND id != ?').get(email, req.params.id);
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      db.prepare(`
        UPDATE teachers 
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            password_hash = ?,
            updated_at = strftime('%s', 'now')
        WHERE id = ?
      `).run(name || null, email || null, passwordHash, req.params.id);
    } else {
      db.prepare(`
        UPDATE teachers 
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            updated_at = strftime('%s', 'now')
        WHERE id = ?
      `).run(name || null, email || null, req.params.id);
    }

    res.json({ message: 'Teacher updated' });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete teacher (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const db = getDatabase();
    
    // Check if teacher has classes
    const classes = db.prepare('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?').get(req.params.id);
    if (classes.count > 0) {
      return res.status(400).json({ error: 'Cannot delete teacher with existing classes' });
    }

    db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Teacher deleted' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;








