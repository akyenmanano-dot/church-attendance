const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/services — list services, most recent first
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM services ORDER BY service_date DESC`
  );
  res.json(rows);
});

// POST /api/services — create a new service/event (e.g. this Sunday)
router.post('/', async (req, res) => {
  const { service_date, service_type, name } = req.body;
  if (!service_date) return res.status(400).json({ error: 'service_date is required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO services (service_date, service_type, name)
       VALUES ($1, $2, $3) RETURNING *`,
      [service_date, service_type || 'sunday', name || 'Sunday Service']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A service already exists for that date/type' });
    }
    throw err;
  }
});

module.exports = router;
