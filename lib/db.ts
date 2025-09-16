// lib/db.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'timer.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new Database(DB_PATH);

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    date TEXT NOT NULL,           -- YYYY-MM-DD
    book TEXT NOT NULL,
    startPage INTEGER NOT NULL,
    endPage INTEGER NOT NULL,
    pagesRead INTEGER NOT NULL,
    timestamp INTEGER NOT NULL    -- ms
  );
  CREATE INDEX IF NOT EXISTS idx_steps_user ON steps(user);
  CREATE INDEX IF NOT EXISTS idx_steps_date ON steps(date);
  CREATE INDEX IF NOT EXISTS idx_steps_book ON steps(book);
  CREATE INDEX IF NOT EXISTS idx_steps_udb ON steps(user, date, book);
`);

export default db;
