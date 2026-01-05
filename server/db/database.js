import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/voting.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase() {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      two_factor_secret TEXT,
      two_factor_enabled INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      voting_open INTEGER DEFAULT 0,
      session_id TEXT UNIQUE,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      has_voted INTEGER DEFAULT 0,
      pin_hash TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS elections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      election_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'single',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      name TEXT NOT NULL,
      photo_url TEXT,
      profile TEXT,
      manifesto TEXT,
      motto TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      position_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      transaction_hash TEXT,
      block_number INTEGER,
      ranked_order INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (position_id) REFERENCES positions(id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    );

    CREATE TABLE IF NOT EXISTS vote_queue (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      position_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_votes_class ON votes(class_id);
    CREATE INDEX IF NOT EXISTS idx_votes_student ON votes(student_id);
    CREATE INDEX IF NOT EXISTS idx_votes_position ON votes(position_id);
    CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp);
    CREATE INDEX IF NOT EXISTS idx_positions_election ON positions(election_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_classid ON candidates(class_id);
  `);

  // Add new columns to candidates table if they don't exist (migration)
  try {
    const columns = db.prepare("PRAGMA table_info(candidates)").all();
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('profile')) {
      db.prepare('ALTER TABLE candidates ADD COLUMN profile TEXT').run();
      console.log('✅ Added profile column to candidates table');
    }
    
    if (!columnNames.includes('manifesto')) {
      db.prepare('ALTER TABLE candidates ADD COLUMN manifesto TEXT').run();
      console.log('✅ Added manifesto column to candidates table');
    }
    
    if (!columnNames.includes('motto')) {
      db.prepare('ALTER TABLE candidates ADD COLUMN motto TEXT').run();
      console.log('✅ Added motto column to candidates table');
    }
    // Add class_id and approved columns to support teacher-submitted candidates (pending approval)
    if (!columnNames.includes('class_id')) {
      db.prepare('ALTER TABLE candidates ADD COLUMN class_id TEXT').run();
      console.log('✅ Added class_id column to candidates table');
    }

    if (!columnNames.includes('approved')) {
      db.prepare('ALTER TABLE candidates ADD COLUMN approved INTEGER DEFAULT 1').run();
      console.log('✅ Added approved column to candidates table');
    }
  } catch (error) {
    console.error('Migration error (may be expected on first run):', error.message);
  }

  // Create default admin teacher if none exists
  const adminExists = db.prepare('SELECT id FROM teachers WHERE email = ?').get('admin@school.co.tz');
  if (!adminExists) {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('admin123', 10);
    const { randomUUID } = await import('crypto');
    db.prepare(`
      INSERT INTO teachers (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), 'admin@school.co.tz', passwordHash, 'Admin User');
    console.log('✅ Default admin created: admin@school.co.tz / admin123');
  }

  // Create default teacher account if none exists
  const teacherExists = db.prepare('SELECT id FROM teachers WHERE email = ?').get('teacher@school.co.tz');
  if (!teacherExists) {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('teacher123', 10);
    const { randomUUID } = await import('crypto');
    db.prepare(`
      INSERT INTO teachers (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), 'teacher@school.co.tz', passwordHash, 'Teacher User');
    console.log('✅ Default teacher created: teacher@school.co.tz / teacher123');
  }

  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}


