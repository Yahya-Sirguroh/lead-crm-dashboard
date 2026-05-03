// ─────────────────────────────────────────────────────────────────────────────
// fix-project-spelling.js
//
// Fixes the spelling mismatch across tblleadform and tblproject.
// All variants ("Silver Senerity", "Silver Serenity", etc.)
// are normalised to one canonical name: "Silver Serenity"
//
// Run ONCE:
//   cd backend
//   node fix-project-spelling.js
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const { MongoClient } = require("mongodb");

// ← CANONICAL name going forward (correct English spelling)
const CANONICAL = "Silver Serenity";

// All known misspellings / variants to replace
const VARIANTS = [
  "Silver Senerity",   // typo in tblproject + ashutosh's record
  "Silver Serenity",   // testuser's record (already correct, kept for safety)
  "silver serenity",
  "silver senerity",
  "Silver serenity",
];

async function run() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db     = client.db(process.env.DB_NAME);

  // ── 1. Fix tblleadform ────────────────────────────────────────────────────
  const leads = db.collection("tblleadform");

  let totalFixed = 0;
  for (const variant of VARIANTS) {
    const res = await leads.updateMany(
      { project: variant },
      { $set: { project: CANONICAL, updatedAt: new Date() } }
    );
    if (res.modifiedCount > 0) {
      console.log(`  tblleadform: "${variant}" → "${CANONICAL}"  (${res.modifiedCount} record(s))`);
      totalFixed += res.modifiedCount;
    }
  }

  // Also fix any leads with no project (assign to canonical)
  const noProject = await leads.updateMany(
    { $or: [{ project: { $exists: false } }, { project: null }, { project: "" }] },
    { $set: { project: CANONICAL, updatedAt: new Date() } }
  );
  if (noProject.modifiedCount > 0) {
    console.log(`  tblleadform: (no project) → "${CANONICAL}"  (${noProject.modifiedCount} record(s))`);
    totalFixed += noProject.modifiedCount;
  }

  console.log(`\n✅ tblleadform: ${totalFixed} lead(s) updated to "${CANONICAL}"`);

  // ── 2. Fix tblproject ─────────────────────────────────────────────────────
  const projects = db.collection("tblproject");

  // Remove all old variant entries
  const deleted = await projects.deleteMany({
    projectName: { $in: VARIANTS.filter(v => v !== CANONICAL) }
  });
  if (deleted.deletedCount > 0) {
    console.log(`\n🗑  tblproject: removed ${deleted.deletedCount} old variant(s)`);
  }

  // Upsert the single canonical project
  const upsert = await projects.updateOne(
    { projectName: CANONICAL },
    {
      $set:         { projectName: CANONICAL, isActive: true, updatedAt: new Date() },
      $setOnInsert: { location: "", description: "", createdAt: new Date() },
    },
    { upsert: true }
  );

  if (upsert.upsertedCount > 0) {
    console.log(`✅ tblproject: inserted "${CANONICAL}"`);
  } else {
    console.log(`✅ tblproject: "${CANONICAL}" already exists — updated`);
  }

  // ── 3. Verify ─────────────────────────────────────────────────────────────
  console.log("\n── Verification ─────────────────────────");
  const canonicalCount = await leads.countDocuments({ project: CANONICAL });
  console.log(`  Leads with project "${CANONICAL}": ${canonicalCount}`);

  const allProjects = await projects.find({}).toArray();
  console.log(`  Projects in tblproject: ${allProjects.map(p => p.projectName).join(", ")}`);

  await client.close();
  console.log("\n🎉 Done! Restart your backend then refresh the dashboard.");
}

run().catch((err) => {
  console.error("❌ Script failed:", err.message);
  process.exit(1);
});
