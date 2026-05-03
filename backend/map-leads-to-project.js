// ─────────────────────────────────────────────────────────────────────────────
// map-leads-to-project.js
//
// Run this ONCE to update all existing leads in tblleadform
// that don't have a project assigned → sets them to "Silver Senerity"
//
// Usage:
//   cd backend
//   node map-leads-to-project.js
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const { MongoClient } = require("mongodb");

async function run() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db     = client.db(process.env.DB_NAME);
  const col    = db.collection("tblleadform");

  // Count how many leads exist
  const total = await col.countDocuments();
  console.log(`📋 Total leads found: ${total}`);

  // Update ALL leads that have no project field (or empty project)
  const result = await col.updateMany(
    {
      $or: [
        { project: { $exists: false } },
        { project: null },
        { project: "" },
      ]
    },
    {
      $set: {
        project:   "Silver Senerity",
        updatedAt: new Date(),
      }
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} lead(s) → project: "Silver Senerity"`);
  console.log(`   Unchanged (already had project): ${total - result.modifiedCount}`);

  // Verify
  const silverCount = await col.countDocuments({ project: "Silver Senerity" });
  console.log(`\n🏢 Leads now under "Silver Senerity": ${silverCount}`);

  await client.close();
}

run().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
