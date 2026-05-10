'use strict';

const express        = require('express');
const cors           = require('cors');
const crypto         = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME     = process.env.DB_NAME || 'silvergroup';

// ─── Simple password hashing (SHA-256 + salt stored in doc) ──────────────────
function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', s).update(password).digest('hex');
  return { hash, salt: s };
}
function verifyPassword(password, storedHash, salt) {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

// ─── DB (cached across warm Vercel invocations) ───────────────────────────────
let db;
async function getDB() {
  if (db) return db;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set');
  const client = new MongoClient(MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  await client.connect();
  db = client.db(DB_NAME);
  console.log('✅ MongoDB connected:', DB_NAME);
  return db;
}

const col = async (name) => { const d = await getDB(); return d.collection(name); };

// ─── APP ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PATCH','DELETE'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password) return res.status(400).json({ error: 'username and password are required' });

    const c = await col('tblusers');
    const user = await c.findOne({ username: username.trim().toLowerCase(), isActive: { $ne: false } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Support plain-text passwords for legacy users (auto-migrate on first login)
    let valid = false;
    if (user.passwordHash && user.passwordSalt) {
      valid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    } else if (user.password) {
      // Legacy plain-text — check then migrate
      valid = user.password === password;
      if (valid) {
        const { hash, salt } = hashPassword(password);
        await c.updateOne({ _id: user._id }, {
          $set: { passwordHash: hash, passwordSalt: salt, updatedAt: new Date() },
          $unset: { password: '' }
        });
      }
    }

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Return safe user object (no password fields)
    const { passwordHash, passwordSalt, password: _pw, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('POST /api/auth/login:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users  (admin only — caller must pass adminUsername header for server-side check)
app.get('/api/auth/users', async (req, res) => {
  try {
    const c = await col('tblusers');
    const users = await c.find({ isActive: { $ne: false } }, {
      projection: { passwordHash: 0, passwordSalt: 0, password: 0 }
    }).sort({ name: 1 }).toArray();
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/users  — add a new user (admin action)
app.post('/api/auth/users', async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name?.trim())     return res.status(400).json({ error: 'name is required' });
    if (!username?.trim()) return res.status(400).json({ error: 'username is required' });
    if (!password)         return res.status(400).json({ error: 'password is required' });

    const c = await col('tblusers');
    const exists = await c.findOne({ username: username.trim().toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Username already exists' });

    const { hash, salt } = hashPassword(password);
    const doc = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      role: role || 'user',      // 'admin' | 'user'
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await c.insertOne(doc);
    const { passwordHash: _h, passwordSalt: _s, ...safeDoc } = doc;
    res.status(201).json({ ...safeDoc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/auth/users/:id — update role or active status (admin)
app.patch('/api/auth/users/:id', async (req, res) => {
  try {
    const allowed = ['name', 'role', 'isActive', 'password'];
    const $set = { updatedAt: new Date() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'password') {
          const { hash, salt } = hashPassword(req.body.password);
          $set.passwordHash = hash;
          $set.passwordSalt = salt;
        } else {
          $set[key] = req.body[key];
        }
      }
    }
    const c = await col('tblusers');
    const result = await c.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set },
      { returnDocument: 'after', projection: { passwordHash: 0, passwordSalt: 0, password: 0 } }
    );
    const updated = result?.value ?? result;
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/auth/users/:id — soft-delete (admin)
app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const c = await col('tblusers');
    await c.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { isActive: false, updatedAt: new Date() } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PROJECTS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/projects', async (req, res) => {
  try {
    const c = await col('tblproject');
    const projects = await c.find({ isActive: { $ne: false } }).sort({ projectName: 1 }).toArray();
    res.json(projects);
  } catch (err) { console.error('GET /api/projects:', err.message); res.status(500).json({ error: err.message }); }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { projectName, location, description } = req.body;
    if (!projectName?.trim()) return res.status(400).json({ error: 'projectName is required' });
    const c = await col('tblproject');
    const doc = { projectName: projectName.trim(), location: location || '', description: description || '', isActive: true, createdAt: new Date(), updatedAt: new Date() };
    const result = await c.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  USERS  (legacy endpoint — kept for AssignedTo dropdowns)
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/users', async (req, res) => {
  try {
    const c = await col('tblusers');
    const users = await c.find({ isActive: { $ne: false } }, {
      projection: { passwordHash: 0, passwordSalt: 0, password: 0 }
    }).sort({ name: 1 }).toArray();
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const c = await col('tblusers');
    const exists = await c.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ error: 'User already exists' });
    const doc = { name: name.trim(), isActive: true, createdAt: new Date() };
    const result = await c.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  LEADS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/leads', async (req, res) => {
  try {
    const { status, city, propertyType, project, q } = req.query;
    const filter = {};
    if (status)       filter.status       = status;
    if (city)         filter.city         = new RegExp(city, 'i');
    if (propertyType) filter.propertyType = propertyType;
    if (project)      filter.project      = new RegExp(`^${project.trim()}$`, 'i');
    if (q) {
      const rx = new RegExp(q, 'i');
      filter.$or = [
        { fullName: rx }, { mobileNumber: rx }, { email: rx },
        { city: rx }, { address: rx }, { budgetRange: rx },
        { source: rx }, { project: rx },
      ];
    }
    const c = await col('tblleadform');
    const leads = await c.find(filter).sort({ createdAt: -1 }).toArray();
    res.json(leads);
  } catch (err) { console.error('GET /api/leads:', err.message); res.status(500).json({ error: err.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const c = await col('tblleadform');
    const existing = await c.findOne({ mobileNumber: req.body.mobileNumber });
    if (existing) return res.status(409).json({ error: 'duplicate_mobile', message: `Mobile number already registered.` });
    const doc = {
      project: req.body.project || '', fullName: String(req.body.fullName || '').trim(),
      email: req.body.email || '', mobileNumber: req.body.mobileNumber || '',
      address: req.body.address || '', locality: req.body.locality || '',
      city: req.body.city || '', country: req.body.country || '',
      pinCode: req.body.pinCode || '', visitingFor: req.body.visitingFor || 'Self',
      occupation: req.body.occupation || '', organization: req.body.organization || '',
      industry: req.body.industry || '', designation: req.body.designation || '',
      officeLocation: req.body.officeLocation || '', officePinCode: req.body.officePinCode || '',
      purposeOfPurchase: req.body.purposeOfPurchase || '', propertyType: req.body.propertyType || '',
      currentResidentType: req.body.currentResidentType || '', budgetRange: req.body.budgetRange || '',
      willBuyIn: req.body.willBuyIn || '',
      hearAboutUs: Array.isArray(req.body.hearAboutUs) ? req.body.hearAboutUs : [],
      referenceDetails: req.body.referenceDetails || '',
      channelPartnerCompany: req.body.channelPartnerCompany || '',
      channelPartnerName: req.body.channelPartnerName || '',
      channelPartnerMobile: req.body.channelPartnerMobile || '',
      channelPartnerRERA: req.body.channelPartnerRERA || '',
      channelPartnerEmail: req.body.channelPartnerEmail || '',
      source: req.body.source || 'Website Form',
      status: req.body.status || 'New',
      otpVerification: req.body.otpVerification || false,
      createdAt: new Date(), updatedAt: new Date(),
    };
    if (!doc.fullName || !doc.mobileNumber) return res.status(400).json({ error: 'fullName and mobileNumber are required' });
    const result = await c.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'duplicate_mobile', message: 'Mobile number already registered.' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const c = await col('tblleadform');
    const lead = await c.findOne({ _id: new ObjectId(req.params.id) });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/leads/:id', async (req, res) => {
  try {
    const allowed = [
      'status', 'assignedTo', 'willBuyIn', 'notes', 'project',
      'family', 'reason', 'funding', 'inventoryPitched', 'quotation',
      'interested', 'ageGroup', 'occupation', 'caste', 'comments',
      'revisitDate', 'nextFollowUp', 'otpVerification',
    ];
    const $set = { updatedAt: new Date() };
    for (const key of allowed) { if (req.body[key] !== undefined) $set[key] = req.body[key]; }
    const c = await col('tblleadform');
    const result = await c.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set },
      { returnDocument: 'after' }
    );
    const updated = result?.value ?? result;
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Health
app.get('/health', async (req, res) => {
  res.json({ status: 'ok', db: db ? 'connected' : 'disconnected' });
});

module.exports = app;
