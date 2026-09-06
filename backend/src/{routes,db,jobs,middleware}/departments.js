const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/departments — plain list, for populating dropdowns
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM departments ORDER BY name');
  res.json(rows);
});

module.exports = router;
