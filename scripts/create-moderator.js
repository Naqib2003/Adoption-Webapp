// ============================================================
// create-moderator.js
//
// This is NOT a website route. There is no URL that reaches this file —
// it only runs when YOU personally type a command in your own terminal.
//
// HOW TO RUN THIS:
//   From your project's root folder (same place as app.js), run:
//     node scripts/create-moderator.js
//   Then just answer the prompts it asks you, one at a time.
// ============================================================

const readline = require('readline');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { isUsernameTaken, registerUsername } = require('../models/shared/usernameRegistry');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

async function main() {
  console.log('=== Create a new Moderator account ===\n');

  const name = await ask('Full name: ');
  const nid_no = await ask('NID No.: ');
  const dob = await ask('Date of birth (YYYY-MM-DD): ');
  const gender = await ask('Gender (male/female/other): ');
  const phone_no = await ask('Phone number: ');
  const email = await ask('Email: ');
  const username = await ask('Username: ');
  const password = await ask('Password: ');

  if (!name || !nid_no || !dob || !gender || !email || !username || !password) {
    console.error('\nAll fields are required. Run the script again.');
    rl.close();
    process.exit(1);
  }

  const taken = await isUsernameTaken(username);
  if (taken) {
    console.error(`\nUsername "${username}" is already taken by another account. Run the script again with a different one.`);
    rl.close();
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    `INSERT INTO moderator_info (name, nid_no, dob, gender, phone_no, email, username, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, nid_no, dob, gender, phone_no, email, username, password_hash]
  );
  const M_ID = result.insertId;

  await registerUsername(username, 'moderator', M_ID);

  console.log(`\nModerator account created. M_ID = ${M_ID}`);

  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFailed to create moderator:', err.message);
  rl.close();
  process.exit(1);
});
