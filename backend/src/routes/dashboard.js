const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/dashboard/summary — total attendance per service (trend line)
router.get('/summary', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.service_date, s.service_type, s.name,
            COUNT(a.id) AS total_present
     FROM services s
     LEFT JOIN attendance a ON a.service_id = s.id
     GROUP BY s.id
     ORDER BY s.service_date ASC`
  );
  res.json(rows);
});

// GET /api/dashboard/departments — attendance rate broken down by department
router.get('/departments', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT d.name AS department,
            COUNT(DISTINCT m.id) AS member_count,
            COUNT(a.id) AS total_attendance_marks,
            ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(DISTINCT m.id) * (SELECT COUNT(*) FROM services), 0) * 100, 1) AS avg_attendance_rate
     FROM departments d
     LEFT JOIN members m ON m.department_id = d.id AND m.status = 'active'
     LEFT JOIN attendance a ON a.member_id = m.id
     GROUP BY d.id
     ORDER BY d.name`
  );
  res.json(rows);
});

// GET /api/dashboard/flags — currently unresolved absence flags
router.get('/flags', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT f.*, m.first_name, m.last_name, m.phone, d.name AS department_name
     FROM flags f
     JOIN members m ON m.id = f.member_id
     LEFT JOIN departments d ON d.id = m.department_id
     WHERE f.resolved = FALSE
     ORDER BY f.created_at DESC`
  );
  res.json(rows);
});

// POST /api/dashboard/flags/:id/resolve — mark a flag as followed up
router.post('/flags/:id/resolve', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `UPDATE flags SET resolved = TRUE, resolved_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Flag not found' });
  res.json(rows[0]);
});

module.exports = router;
