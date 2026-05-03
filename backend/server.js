'use strict';

const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();

const app = express();

// ── Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",  // Vite dev server
    "http://localhost:3000",  // CRA dev server
    "http://localhost:4173",  // Vite preview
  ],
  credentials: true,
}));
app.use(express.json());

// ── Routes
app.use("/api/leads",    require("./routes/leads"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/users",    require("./routes/users"));    // ← NEW

// ── Health check
app.get("/", (req, res) => res.json({ status: "API is running ✅" }));
app.get("/health", (req, res) => res.json({ status: "ok", db: app.locals.db ? "connected" : "disconnected" }));

// ── Connect MongoDB & start server
const PORT = process.env.PORT || 5000;

MongoClient.connect(process.env.MONGODB_URI)
  .then((client) => {
    app.locals.db = client.db(process.env.DB_NAME);
    console.log(`✅ MongoDB connected → DB: "${process.env.DB_NAME}"`);
    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`\n   GET  /api/leads       — list / filter leads`);
      console.log(`   POST /api/leads       — create lead from form`);
      console.log(`   PATCH /api/leads/:id  — update lead`);
      console.log(`   GET  /api/projects    — list projects`);
      console.log(`   POST /api/projects    — add project`);
      console.log(`   GET  /api/users       — list users (Assigned To dropdown)`);
      console.log(`   POST /api/users       — add user`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
