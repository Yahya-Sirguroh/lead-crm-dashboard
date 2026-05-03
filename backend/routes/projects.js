// routes/projects.js
const express = require("express");
const router  = express.Router();

const col = (req) => req.app.locals.db.collection("tblproject");

// GET /api/projects  — returns all active projects
router.get("/", async (req, res) => {
  try {
    const projects = await col(req)
      .find({ isActive: { $ne: false } })
      .sort({ projectName: 1 })
      .toArray();
    res.json(projects);
  } catch (err) {
    console.error("GET /projects:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects  — add a new project
router.post("/", async (req, res) => {
  try {
    const { projectName, location, description } = req.body;
    if (!projectName?.trim()) return res.status(400).json({ error: "projectName is required" });

    const doc = {
      projectName: projectName.trim(),
      location:    location    || "",
      description: description || "",
      isActive:    true,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    };
    const result = await col(req).insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
