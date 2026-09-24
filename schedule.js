const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all schedule
router.get('/', (req, res) => {
  db.all('SELECT * FROM schedule ORDER BY day_of_week, lesson_order', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add lesson
router.post('/', (req, res) => {
  const { day_of_week, lesson_order, subject, room, teacher, time_start, time_end } = req.body;
  const sql = `INSERT INTO schedule (day_of_week, lesson_order, subject, room, teacher, time_start, time_end) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [day_of_week, lesson_order, subject, room, teacher, time_start, time_end], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...req.body });
  });
});

// Update lesson
router.put('/:id', (req, res) => {
  const { day_of_week, lesson_order, subject, room, teacher, time_start, time_end } = req.body;
  const sql = `UPDATE schedule SET day_of_week=?, lesson_order=?, subject=?, room=?, teacher=?, time_start=?, time_end=? WHERE id=?`;
  db.run(sql, [day_of_week, lesson_order, subject, room, teacher, time_start, time_end, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Delete lesson
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM schedule WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
