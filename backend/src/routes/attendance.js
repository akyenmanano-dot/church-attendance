const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// POST /api/attendance — mark one member present for a service
// Safe under concurrency: UNIQUE(member_id, service_id) + ON CONFLICT DO NOTHING
// means two ushers marking the same person at the same time never double-counts
// or errors out — the second request just confirms "already marked".
router.post('/', requireAuth, async (req, res) => {
  const { member_id, service_id } = req.body;
  const marked_by = req.user.name;
  if (!member_id || !service_id) {
    return res.status(400).json({ error: 'member_id and service_id are required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO attendance (member_id, service_id, marked_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (member_id, service_id) DO NOTHING
     RETURNING *`,
    [member_id, service_id, marked_by || 'unknown']
  );

  if (rows.length) {
    return res.status(201).json({ marked: true, alreadyPresent: false, record: rows[0] });
  }
  // Already existed — not an error, just tell the usher it was already marked
  res.status(200).json({ marked: true, alreadyPresent: true });
});

// DELETE /api/attendance — undo a mark (e.g. usher tapped by mistake)
router.delete('/', requireAuth, async (req, res) => {
  const { member_id, service_id } = req.body;
  await pool.query(
    `DELETE FROM attendance WHERE member_id = $1 AND service_id = $2`,
    [member_id, service_id]
  );
  res.status(204).send();
});

// GET /api/attendance/service/:service_id — full roll call for a service
// (who's present, who's not, so the UI can render one checklist regardless
// of which usher already marked whom)
router.get('/service/:service_id', async (req, res) => {
  const { service_id } = req.params;
  const { rows } = await pool.query(
    `SELECT m.id AS member_id, m.first_name, m.last_name, m.department_id,
            (a.id IS NOT NULL) AS present, a.marked_by, a.marked_at
     FROM members m
     LEFT JOIN attendance a ON a.member_id = m.id AND a.service_id = $1
     WHERE m.status = 'active'
     ORDER BY m.last_name, m.first_name`,
    [service_id]
  );
  res.json(rows);
});

module.exports = router;
