const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all homework
router.get('/', (req, res) => {
  db.all('SELECT * FROM homework ORDER BY due_date', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add homework
router.post('/', (req, res) => {
  const { subject, description, due_date } = req.body;
  const sql = `INSERT INTO homework (subject, description, due_date) VALUES (?, ?, ?)`;
  db.run(sql, [subject, description, due_date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...req.body });
  });
});

// Toggle complete
router.patch('/:id', (req, res) => {
  db.run('UPDATE homework SET completed = NOT completed WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Delete homework
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM homework WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
