const express = require('express');
const router = express.Router();
const { flagAbsentees } = require('../jobs/flagAbsentees');
const { requireAuth } = require('../middleware/auth');

// POST /api/run-flag-check — run the absence-flagging sweep on demand
// (in production you'd also run this on a schedule, e.g. every Monday morning
// via node-cron or a system cron job — see README)
router.post('/', requireAuth, async (req, res) => {
  const result = await flagAbsentees();
  res.json(result);
});

module.exports = router;
