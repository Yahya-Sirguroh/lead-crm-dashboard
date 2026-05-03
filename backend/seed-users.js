// ─────────────────────────────────────────────────────────────────────────────
// seed-users.js
// Creates tblusers collection and inserts: Ritik, Rishabh, Rohan, Ali
//
// Run ONCE from your backend folder:
//   node seed-users.js
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const { MongoClient } = require("mongodb");

const USERS = ["Ritik", "Rishabh", "Rohan", "Ali"];

async function seed() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db     = client.db(process.env.DB_NAME);
  const col    = db.collection("tblusers");

  let inserted = 0;
  for (const name of USERS) {
    const exists = await col.findOne({ name });
    if (exists) {
      console.log(`⏭  "${name}" already exists — skipped`);
    } else {
      await col.insertOne({ name, isActive: true, createdAt: new Date() });
      console.log(`✅ Inserted "${name}"`);
      inserted++;
    }
  }

  const total = await col.countDocuments();
  console.log(`\n📋 tblusers now has ${total} user(s)`);
  console.log(`   Restart your backend to start using the /api/users route.`);

  await client.close();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
