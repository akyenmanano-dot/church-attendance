const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { JWT_SECRET, requireAuth, requireRole } = require('../middleware/auth');

const MAX_USHERS = parseInt(process.env.MAX_USHERS || '5', 10);

// POST /api/auth/register — create an account.
// The very first person to register becomes 'admin' automatically (bootstrap).
// Everyone after that registers as 'usher', up to a cap of MAX_USHERS —
// once full, registration is closed and an admin has to make room
// (promote someone to admin, or remove an account) before anyone else can join.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const { rows: existingCount } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  const isFirstAccount = existingCount[0].count === 0;

  if (!isFirstAccount) {
    const { rows: usherCount } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'usher'`
    );
    if (usherCount[0].count >= MAX_USHERS) {
      return res.status(403).json({
        error: `Usher accounts are full (${MAX_USHERS} max). Ask an admin to make room before registering.`,
      });
    }
  }

  const role = isFirstAccount ? 'admin' : 'usher';

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, password_hash, role]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/auth/users — admin only, list every usher/admin account (no password data)
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
  res.json(rows);
});

// POST /api/auth/users/:id/reset-password — admin only, set someone's password directly
// (used since this system doesn't have self-service email reset — see project notes)
router.post('/users/:id/reset-password', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  const password_hash = await bcrypt.hash(newPassword, 10);
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email, role`,
    [password_hash, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: rows[0] });
});

// POST /api/auth/users/:id/role — admin only, promote a usher to admin or demote an admin to usher.
// Refuses to demote the last remaining admin, so the church never gets locked out entirely.
router.post('/users/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'usher'].includes(role)) {
    return res.status(400).json({ error: "role must be 'admin' or 'usher'" });
  }

  if (role === 'usher') {
    const { rows: adminCount } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND id != $1`,
      [id]
    );
    if (adminCount[0].count === 0) {
      return res.status(400).json({ error: 'Cannot remove the last admin — promote someone else first' });
    }
    const { rows: usherCount } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'usher'`
    );
    if (usherCount[0].count >= MAX_USHERS) {
      return res.status(400).json({ error: `Usher accounts are already full (${MAX_USHERS} max)` });
    }
  }

  const { rows } = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
    [role, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: rows[0] });
});

module.exports = router;
