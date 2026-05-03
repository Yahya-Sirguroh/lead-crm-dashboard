// routes/users.js
const express = require("express");
const router  = express.Router();

const col = (req) => req.app.locals.db.collection("tblusers");

// ── GET /api/users — all active users (for Assigned To dropdown)
router.get("/", async (req, res) => {
  try {
    const users = await col(req)
      .find({ isActive: { $ne: false } })
      .sort({ name: 1 })
      .toArray();
    res.json(users);
  } catch (err) {
    console.error("GET /users:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/users — add a new user
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "name is required" });

    const exists = await col(req).findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ error: "User already exists" });

    const doc = {
      name:      name.trim(),
      isActive:  true,
      createdAt: new Date(),
    };
    const result = await col(req).insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error("POST /users:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
