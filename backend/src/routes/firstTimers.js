const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/first-timers — list everyone logged, most recent first
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ft.*, s.name AS service_name, s.service_date
     FROM first_timers ft
     LEFT JOIN services s ON s.id = ft.service_id
     ORDER BY ft.created_at DESC`
  );
  res.json(rows);
});

// POST /api/first-timers — log a new visitor
router.post('/', requireAuth, async (req, res) => {
  const { first_name, last_name, phone, invited_by, notes, service_id } = req.body;
  if (!first_name) {
    return res.status(400).json({ error: 'first_name is required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO first_timers (first_name, last_name, phone, invited_by, notes, service_id, logged_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [first_name, last_name || null, phone || null, invited_by || null, notes || null, service_id || null, req.user.name]
  );
  res.status(201).json(rows[0]);
});

// POST /api/first-timers/:id/resolve — mark as followed up
router.post('/:id/resolve', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `UPDATE first_timers SET followed_up = TRUE, followed_up_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'First-timer not found' });
  res.json(rows[0]);
});

// DELETE /api/first-timers/:id — admin only, for cleaning up mistaken entries
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM first_timers WHERE id = $1', [id]);
  if (!result.rowCount) return res.status(404).json({ error: 'First-timer not found' });
  res.status(204).send();
});

module.exports = router;
