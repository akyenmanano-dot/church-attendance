const { Pool } = require('pg');

// If DATABASE_URL is set (e.g. Neon's connection string in production),
// use that directly and enable SSL, which cloud Postgres providers require.
// Otherwise fall back to the individual DB_* variables for local development.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'church_attendance',
    });

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error', err);
});

module.exports = pool;
