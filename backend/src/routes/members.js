const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/members  — list all members (optionally filter by department/status)
router.get('/', async (req, res) => {
  const { department_id, status } = req.query;
  const conditions = [];
  const values = [];

  if (department_id) {
    values.push(department_id);
    conditions.push(`m.department_id = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`m.status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT m.*, d.name AS department_name
     FROM members m
     LEFT JOIN departments d ON d.id = m.department_id
     ${where}
     ORDER BY m.last_name, m.first_name`,
    values
  );
  res.json(rows);
});

// POST /api/members/self-register — PUBLIC, no login required.
// Lets a member add their own details. Lands as status='pending' so an
// admin/usher has to approve them before they show up in roll call —
// this stops random submissions from landing straight in the official roll.
router.post('/self-register', async (req, res) => {
  const { first_name, last_name, phone, email, department_id } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'first_name and last_name are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO members (first_name, last_name, phone, email, department_id, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [first_name, last_name, phone || null, email || null, department_id || null]
  );
  res.status(201).json(rows[0]);
});

// POST /api/members/my-attendance — PUBLIC, no login required.
// A member looks up their OWN attendance using their name + phone as a simple
// shared secret (the same details they gave when they joined). Deliberately
// does not accept a member ID directly — that would let anyone browse
// anyone else's record just by guessing numbers.
router.post('/my-attendance', async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  if (!first_name || !last_name || !phone) {
    return res.status(400).json({ error: 'first_name, last_name and phone are all required' });
  }

  const { rows: matches } = await pool.query(
    `SELECT id, first_name, last_name FROM members
     WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) AND phone = $3
     LIMIT 1`,
    [first_name.trim(), last_name.trim(), phone.trim()]
  );

  if (!matches.length) {
    return res.status(404).json({ error: "No matching record found — check your name and phone number match what's on file" });
  }

  const member = matches[0];
  const { rows } = await pool.query(
    `SELECT s.id AS service_id, s.service_date, s.service_type, s.name,
            (a.id IS NOT NULL) AS present
     FROM services s
     LEFT JOIN attendance a ON a.service_id = s.id AND a.member_id = $1
     ORDER BY s.service_date DESC`,
    [member.id]
  );
  const total = rows.length;
  const attended = rows.filter((r) => r.present).length;

  res.json({
    first_name: member.first_name,
    last_name: member.last_name,
    history: rows,
    total_services: total,
    attended,
    attendance_rate: total ? +(attended / total * 100).toFixed(1) : null,
  });
});

// POST /api/members — add a new member (usher/admin only)
router.post('/', requireAuth, async (req, res) => {
  const { first_name, last_name, phone, email, department_id } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'first_name and last_name are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO members (first_name, last_name, phone, email, department_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [first_name, last_name, phone || null, email || null, department_id || null]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/members/:id — edit a member
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, email, department_id, status } = req.body;
  const { rows } = await pool.query(
    `UPDATE members SET
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       phone = COALESCE($3, phone),
       email = COALESCE($4, email),
       department_id = COALESCE($5, department_id),
       status = COALESCE($6, status)
     WHERE id = $7 RETURNING *`,
    [first_name, last_name, phone, email, department_id, status, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Member not found' });
  res.json(rows[0]);
});

// DELETE /api/members/:id — admin only, since this also erases attendance history
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM members WHERE id = $1', [id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Member not found' });
  res.status(204).send();
});

// GET /api/members/:id/attendance — a member's full attendance history + rate (staff only)
router.get('/:id/attendance', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT s.id AS service_id, s.service_date, s.service_type, s.name,
            (a.id IS NOT NULL) AS present
     FROM services s
     LEFT JOIN attendance a ON a.service_id = s.id AND a.member_id = $1
     ORDER BY s.service_date DESC`,
    [id]
  );
  const total = rows.length;
  const attended = rows.filter((r) => r.present).length;
  res.json({
    history: rows,
    total_services: total,
    attended,
    attendance_rate: total ? +(attended / total * 100).toFixed(1) : null,
  });
});

module.exports = router;
