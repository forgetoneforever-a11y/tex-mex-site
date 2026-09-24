const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = 'uploads/';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Get all notes
router.get('/', (req, res) => {
  db.all('SELECT * FROM notes ORDER BY date DESC, time DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add note with media upload
router.post('/', upload.single('media'), (req, res) => {
  const { date, time, content, type, importance } = req.body;
  const media_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  const sql = `INSERT INTO notes (date, time, content, type, importance, media_url) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [date, time, content, type || 'general', importance || 'normal', media_url], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, date, time, content, type, importance, media_url });
  });
});

// Update note
router.put('/:id', upload.single('media'), (req, res) => {
  const { date, time, content, type, importance, existing_media } = req.body;
  const media_url = req.file ? `/uploads/${req.file.filename}` : existing_media || null;
  
  const sql = `UPDATE notes SET date=?, time=?, content=?, type=?, importance=?, media_url=? WHERE id=?`;
  db.run(sql, [date, time, content, type, importance || 'normal', media_url, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Delete note
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM notes WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
