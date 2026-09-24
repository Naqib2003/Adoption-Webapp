// Central lookup table enforcing ONE username across every account type —
// an Adopter, a Legal Guardian, and a Legal Entity can never share a
// username, even though they live in separate tables. This is what makes
// username-based login possible: one query here tells us which table and
// which row to check next, without the caller needing to know the role.
const db = require('../../config/db');

async function isUsernameTaken(username) {
  const [rows] = await db.query('SELECT username FROM usernames WHERE username = ?', [username]);
  return rows.length > 0;
}

async function registerUsername(username, account_type, account_id) {
  await db.query(
    'INSERT INTO usernames (username, account_type, account_id) VALUES (?, ?, ?)',
    [username, account_type, account_id]
  );
}

async function lookupUsername(username) {
  const [rows] = await db.query('SELECT * FROM usernames WHERE username = ?', [username]);
  return rows[0];
}

module.exports = { isUsernameTaken, registerUsername, lookupUsername };
