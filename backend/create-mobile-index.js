// ─────────────────────────────────────────────────────────────────────────────
// create-mobile-index.js
//
// Creates a UNIQUE index on mobileNumber in tblleadform.
// This enforces at the database level that no two leads
// can have the same mobile number.
//
// Run ONCE from your backend folder:
//   node create-mobile-index.js
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const { MongoClient } = require("mongodb");

async function run() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db     = client.db(process.env.DB_NAME);
  const col    = db.collection("tblleadform");

  // ── 1. Check for existing duplicates before creating index
  console.log("🔍 Checking for existing duplicate mobile numbers...\n");

  const duplicates = await col.aggregate([
    { $group: { _id: "$mobileNumber", count: { $sum: 1 }, names: { $push: "$fullName" } } },
    { $match: { count: { $gt: 1 } } },
    { $sort:  { count: -1 } },
  ]).toArray();

  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} duplicate mobile number(s):\n`);
    duplicates.forEach(d => {
      console.log(`   📞 ${d._id}  (${d.count} records) → ${d.names.join(", ")}`);
    });
    console.log(`\n❌ Cannot create unique index while duplicates exist.`);
    console.log(`   Please resolve the above duplicates in MongoDB Atlas first,`);
    console.log(`   then re-run this script.\n`);
    await client.close();
    return;
  }

  console.log("✅ No duplicates found.\n");

  // ── 2. Create the unique index
  try {
    const result = await col.createIndex(
      { mobileNumber: 1 },
      {
        unique: true,
        name:   "unique_mobileNumber",
        // Sparse: false means even empty strings must be unique.
        // If you want to allow multiple leads with no mobile number,
        // set sparse: true instead.
        sparse: false,
      }
    );
    console.log(`✅ Unique index created: "${result}"`);
    console.log(`   Collection : tblleadform`);
    console.log(`   Field      : mobileNumber`);
    console.log(`   Effect     : Duplicate mobile numbers are now REJECTED by MongoDB.\n`);
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log("ℹ️  A unique index on mobileNumber already exists — nothing to do.");
    } else {
      console.error("❌ Failed to create index:", err.message);
    }
  }

  // ── 3. List all indexes to confirm
  const indexes = await col.indexes();
  console.log("📋 Current indexes on tblleadform:");
  indexes.forEach(idx => {
    const unique = idx.unique ? " [UNIQUE]" : "";
    console.log(`   - ${idx.name}${unique}  →  ${JSON.stringify(idx.key)}`);
  });

  await client.close();
}

run().catch(err => {
  console.error("❌ Script failed:", err.message);
  process.exit(1);
});
