const pool = require('./config/db');

async function test() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('DB connected! Test query result:', rows[0].result);
  } catch (err) {
    console.error('DB connection failed:', err.message);
  }
}

test();