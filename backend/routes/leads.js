// routes/leads.js
const express      = require("express");
const router       = express.Router();
const { ObjectId } = require("mongodb");

const col = (req) => req.app.locals.db.collection("tblleadform");

// ── GET /api/leads
// Query params: ?status=New &city=thane &propertyType=3+BHK &project=Silver+Serenity &q=yahya
router.get("/", async (req, res) => {
  try {
    const { status, city, propertyType, project, q } = req.query;
    const filter = {};

    if (status)       filter.status       = status;
    if (city)         filter.city         = new RegExp(city, "i");
    if (propertyType) filter.propertyType = propertyType;
    if (project)      filter.project      = new RegExp(`^${project.trim()}$`, "i");

    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [
        { fullName: rx }, { mobileNumber: rx }, { email: rx },
        { city: rx }, { address: rx }, { budgetRange: rx },
        { source: rx }, { project: rx },
      ];
    }

    const leads = await col(req)
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(leads);
  } catch (err) {
    console.error("GET /leads:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/leads — submit new lead from the lead form
router.post("/", async (req, res) => {
  try {
    const {
      project, fullName, email, mobileNumber, address, locality,
      city, country, pinCode, visitingFor, occupation, organization,
      industry, designation, officeLocation, officePinCode,
      purposeOfPurchase, propertyType, currentResidentType,
      budgetRange, willBuyIn, hearAboutUs, referenceDetails,
      channelPartnerCompany, channelPartnerName, channelPartnerMobile,
      channelPartnerRERA, channelPartnerEmail, source, status,
    } = req.body;

    if (!fullName || !mobileNumber) {
      return res.status(400).json({ error: "fullName and mobileNumber are required" });
    }

    const doc = {
      project:               project               || "",
      fullName:              String(fullName).trim(),
      email:                 email                 || "",
      mobileNumber:          mobileNumber          || "",
      address:               address               || "",
      locality:              locality              || "",
      city:                  city                  || "",
      country:               country               || "",
      pinCode:               pinCode               || "",
      visitingFor:           visitingFor           || "Self",
      occupation:            occupation            || "",
      organization:          organization          || "",
      industry:              industry              || "",
      designation:           designation           || "",
      officeLocation:        officeLocation        || "",
      officePinCode:         officePinCode         || "",
      purposeOfPurchase:     purposeOfPurchase     || "",
      propertyType:          propertyType          || "",
      currentResidentType:   currentResidentType   || "",
      budgetRange:           budgetRange           || "",
      willBuyIn:             willBuyIn             || "",
      hearAboutUs:           Array.isArray(hearAboutUs) ? hearAboutUs : [],
      referenceDetails:      referenceDetails      || "",
      channelPartnerCompany: channelPartnerCompany || "",
      channelPartnerName:    channelPartnerName    || "",
      channelPartnerMobile:  channelPartnerMobile  || "",
      channelPartnerRERA:    channelPartnerRERA    || "",
      channelPartnerEmail:   channelPartnerEmail   || "",
      source:                source                || "Website Form",
      status:                status                || "New",
      createdAt:             new Date(),
      updatedAt:             new Date(),
    };

    // ── Check for duplicate mobile number before inserting
    const existing = await col(req).findOne({ mobileNumber: doc.mobileNumber });
    if (existing) {
      return res.status(409).json({
        error: "duplicate_mobile",
        message: `Mobile number ${doc.mobileNumber} is already registered. Lead exists for: ${existing.fullName}`,
      });
    }

    const result = await col(req).insertOne(doc);
    console.log(`✅ Lead saved → ${doc.fullName}`);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    // MongoDB unique index duplicate key error code
    if (err.code === 11000) {
      return res.status(409).json({
        error: "duplicate_mobile",
        message: `Mobile number already registered.`,
      });
    }
    console.error("POST /leads:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/leads/:id
router.get("/:id", async (req, res) => {
  try {
    const lead = await col(req).findOne({ _id: new ObjectId(req.params.id) });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/leads/:id — update lead fields from dashboard Update modal
router.patch("/:id", async (req, res) => {
  try {
    const allowed = [
      // original fields
      "status", "assignedTo", "willBuyIn", "notes", "project",
      // new fields added in Update modal
      "family", "reason", "funding", "inventoryPitched", "quotation",
      "interested", "ageGroup", "occupation", "caste", "comments",
      "revisitDate", "nextFollowUp",
    ];

    const $set = { updatedAt: new Date() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) $set[key] = req.body[key];
    }

    const result = await col(req).findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set },
      { returnDocument: "after" }
    );

    const updated = result?.value ?? result;
    if (!updated) return res.status(404).json({ error: "Lead not found" });
    res.json(updated);
  } catch (err) {
    console.error("PATCH /leads/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
