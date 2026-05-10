/**
 * create-admin.js
 * 
 * Run ONCE to create your first admin user in MongoDB Atlas.
 * 
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node create-admin.js
 * 
 * Or with .env:
 *   node -r dotenv/config create-admin.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME     = process.env.DB_NAME || 'silvergroup';

// ── CHANGE THESE BEFORE RUNNING ──────────────────────────────────────────────
const ADMIN_NAME     = 'Admin';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin@1234';   // ← Change this!
// ─────────────────────────────────────────────────────────────────────────────

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', s).update(password).digest('hex');
  return { hash, salt: s };
}

async function main() {
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI not set. Run: MONGODB_URI="..." node create-admin.js');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI, { tls: true, tlsAllowInvalidCertificates: true });
  await client.connect();
  const db  = client.db(DB_NAME);
  const col = db.collection('tblusers');

  const existing = await col.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    console.log(`⚠️  User "${ADMIN_USERNAME}" already exists — skipping creation.`);
    console.log('   To reset password, delete the user from MongoDB Atlas and re-run.');
    await client.close();
    return;
  }

  const { hash, salt } = hashPassword(ADMIN_PASSWORD);
  const doc = {
    name:         ADMIN_NAME,
    username:     ADMIN_USERNAME,
    passwordHash: hash,
    passwordSalt: salt,
    role:         'admin',
    isActive:     true,
    createdAt:    new Date(),
    updatedAt:    new Date(),
  };

  await col.insertOne(doc);
  console.log(`✅  Admin user created!`);
  console.log(`   Username : ${ADMIN_USERNAME}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   Role     : admin`);
  console.log('\n⚠️  Please change the password after first login.');
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
