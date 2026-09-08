const pool = require('../db/pool');

const STREAK_THRESHOLD = parseInt(process.env.ABSENCE_STREAK_THRESHOLD || '3', 10);

/**
 * For every active member, look at their most recent N Sunday services
 * (N = STREAK_THRESHOLD) and check whether they missed ALL of them in a row.
 * If so, and there isn't already an unresolved flag for this member, create one.
 *
 * This is deliberately simple and readable rather than one giant SQL query,
 * since the logic ("consecutive misses counting back from today") is easier
 * to get right and explain in JS.
 */
async function flagAbsentees() {
  const client = await pool.connect();
  try {
    const { rows: members } = await client.query(
      `SELECT id, first_name, last_name FROM members WHERE status = 'active'`
    );

    const { rows: recentServices } = await client.query(
      `SELECT id, service_date FROM services
       WHERE service_type = 'sunday'
       ORDER BY service_date DESC
       LIMIT $1`,
      [STREAK_THRESHOLD]
    );

    if (recentServices.length < STREAK_THRESHOLD) {
      // Not enough service history yet to judge a streak fairly.
      return { flagged: [], skipped: 'not_enough_services' };
    }

    const serviceIds = recentServices.map((s) => s.id);
    const flaggedMembers = [];

    for (const member of members) {
      const { rows: attended } = await client.query(
        `SELECT service_id FROM attendance
         WHERE member_id = $1 AND service_id = ANY($2::int[])`,
        [member.id, serviceIds]
      );
      const attendedSet = new Set(attended.map((r) => r.service_id));
      const missedAll = serviceIds.every((id) => !attendedSet.has(id));

      if (!missedAll) continue;

      // Don't create a duplicate flag if an unresolved one already exists
      const { rows: existing } = await client.query(
        `SELECT id FROM flags WHERE member_id = $1 AND resolved = FALSE`,
        [member.id]
      );
      if (existing.length) continue;

      const reason = STREAK_THRESHOLD === 1
        ? 'Missed last Sunday service'
        : `Missed last ${STREAK_THRESHOLD} Sunday services in a row`;

      await client.query(
        `INSERT INTO flags (member_id, reason, streak_count)
         VALUES ($1, $2, $3)`,
        [member.id, reason, STREAK_THRESHOLD]
      );
      flaggedMembers.push(`${member.first_name} ${member.last_name}`);
    }

    return { flagged: flaggedMembers, threshold: STREAK_THRESHOLD };
  } finally {
    client.release();
  }
}

module.exports = { flagAbsentees, STREAK_THRESHOLD };
