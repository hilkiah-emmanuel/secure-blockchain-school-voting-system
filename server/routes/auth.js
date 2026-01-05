import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getDatabase } from '../db/database.js';
import { randomUUID } from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;
    const db = getDatabase();

    const teacher = db.prepare('SELECT * FROM teachers WHERE email = ?').get(email);
    
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, teacher.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (teacher.two_factor_enabled) {
      if (!twoFactorCode) {
        return res.status(401).json({ 
          error: '2FA code required',
          requires2FA: true 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: teacher.two_factor_secret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    const isAdmin = teacher.email.includes('admin') || (teacher.email.includes('@school.co.tz') && teacher.email.startsWith('admin'));
    const token = jwt.sign(
      { 
        id: teacher.id, 
        email: teacher.email,
        name: teacher.name,
        isAdmin: isAdmin
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        isAdmin: isAdmin,
        twoFactorEnabled: teacher.two_factor_enabled === 1
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register (admin only in production)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = getDatabase();

    // Check if email exists
    const existing = db.prepare('SELECT id FROM teachers WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    db.prepare(`
      INSERT INTO teachers (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(id, email, passwordHash, name);

    res.json({ message: 'Teacher registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup 2FA
router.post('/setup-2fa', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();

    const secret = speakeasy.generateSecret({
      name: `VoteSecure (${decoded.email})`,
      issuer: 'VoteSecure'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (user needs to verify before enabling)
    db.prepare(`
      UPDATE teachers 
      SET two_factor_secret = ?
      WHERE id = ?
    `).run(secret.base32, decoded.id);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enable 2FA (after verification)
router.post('/enable-2fa', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { code } = req.body;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();

    const teacher = db.prepare('SELECT two_factor_secret FROM teachers WHERE id = ?').get(decoded.id);
    
    if (!teacher.two_factor_secret) {
      return res.status(400).json({ error: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: teacher.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    db.prepare(`
      UPDATE teachers 
      SET two_factor_enabled = 1
      WHERE id = ?
    `).run(decoded.id);

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export default router;

// Current user
router.get('/me', authenticateToken, (req, res) => {
  try {
    // req.user was populated by authenticateToken
    res.json({ user: req.user });
  } catch (err) {
    console.error('Auth me error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


