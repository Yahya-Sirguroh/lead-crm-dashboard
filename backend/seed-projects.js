// ─────────────────────────────────────────────────────────────────────────────
// seed-projects.js
// Run ONCE to create the tblproject collection and insert your first project.
//
// Usage:
//   cd backend
//   node seed-projects.js
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const { MongoClient } = require("mongodb");

async function seed() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db     = client.db(process.env.DB_NAME);

  const col = db.collection("tblproject");

  // Avoid duplicate inserts if you run this script more than once
  const existing = await col.findOne({ projectName: "Silver Senerity" });
  if (existing) {
    console.log("✅ 'Silver Senerity' already exists — nothing inserted.");
    await client.close();
    return;
  }

  const result = await col.insertOne({
    projectName:  "Silver Senerity",
    location:     "",          // fill in later if needed
    description:  "",
    isActive:     true,
    createdAt:    new Date(),
    updatedAt:    new Date(),
  });

  console.log("✅ Project inserted! ID:", result.insertedId.toString());
  console.log("   Collection: tblproject  |  DB:", process.env.DB_NAME);
  await client.close();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
