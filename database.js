const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./texmex.db');

db.serialize(() => {
  // Schedule table
  db.run(`CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER,
    lesson_order INTEGER,
    subject TEXT,
    room TEXT,
    teacher TEXT,
    time_start TEXT,
    time_end TEXT
  )`);

  // Homework table
  db.run(`CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT,
    description TEXT,
    due_date TEXT,
    due_time TEXT,
    notify_sent INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notes table with importance and media
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    time TEXT,
    content TEXT,
    type TEXT DEFAULT 'general',
    importance TEXT DEFAULT 'normal',
    media_url TEXT,
    notify_sent INTEGER DEFAULT 0
  )`);
});

module.exports = db;
