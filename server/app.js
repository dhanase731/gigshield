import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const app = express();

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, default: "User", trim: true },
    phone: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    weeklyPay: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const UserProfile = mongoose.models.UserProfile || mongoose.model("UserProfile", userSchema);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true, trim: true },
    zone: { type: String, required: true, trim: true },
    eta: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    risk: { type: String, required: true, enum: ["Low", "Medium", "High"] },
    userUid: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const claimDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, default: "", trim: true },
    uploaded: { type: Boolean, default: true },
    uploadedBy: { type: String, default: "user", trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const claimEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, default: "note", trim: true },
    message: { type: String, required: true, trim: true },
    actor: { type: String, default: "system", trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const claimSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, unique: true, index: true, trim: true },
    date: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Submitted", "Processing", "In Review", "More Info Needed", "Approved", "Rejected", "Settled"],
      default: "Submitted",
    },
    userUid: { type: String, default: "", trim: true },
    incidentType: { type: String, default: "General Claim", trim: true },
    incidentDate: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    currentStep: {
      type: String,
      enum: ["fnol", "triage", "investigation", "decision", "settlement", "closure"],
      default: "fnol",
    },
    sla: { type: String, default: "Pending assignment", trim: true },
    documents: { type: [claimDocumentSchema], default: [] },
    timeline: { type: [claimEventSchema], default: [] },
    settlementMethod: { type: String, default: "", trim: true },
    settlementReference: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const Claim = mongoose.models.Claim || mongoose.model("Claim", claimSchema);

const normalizeClaimStatus = (status) => {
  if (!status) return "Submitted";

  if (status === "Pending") {
    return "Submitted";
  }

  if (status === "Processing") {
    return "In Review";
  }

  return status;
};

const generateClaimId = () => {
  const ymd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = Math.floor(Math.random() * 900 + 100);
  return `CLM-${ymd}-${randomPart}`;
};

const mapClaimForResponse = (claim) => {
  const mappedStatus = normalizeClaimStatus(claim.status);
  return {
    ...claim,
    id: claim.claimId,
    filedOn: claim.date,
    incidentType: claim.incidentType || claim.reason,
    status: mappedStatus,
    documents: (claim.documents || []).map((document) => ({
      ...document,
      uploaded: document.uploaded !== false,
    })),
    timeline: (claim.timeline || []).map((entry) => ({
      ...entry,
      createdAt: entry.createdAt || claim.createdAt,
    })),
  };
};

app.use(cors());
app.use(express.json());

let connectionPromise = null;

export const connectToMongo = async () => {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured in the deployment environment");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || "gigshield",
  });

  try {
    await connectionPromise;
  } finally {
    connectionPromise = null;
  }
};

app.get("/api/health", (_req, res) => {
  const state = mongoose.connection.readyState;
  const dbConnected = state === 1;

  res.json({
    status: dbConnected ? "Operational" : "Degraded",
    service: "GigShield API",
    database: dbConnected ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/users/:uid/profile", async (req, res) => {
  try {
    const { uid } = req.params;
    const profile = await UserProfile.findOne({ uid }).lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

app.put("/api/users/:uid/profile", async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, phone, location, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const updateSet = {
      uid,
      email,
    };

    if (name !== undefined) {
      updateSet.name = name || "User";
    }
    if (phone !== undefined) {
      updateSet.phone = phone || "";
    }
    if (location !== undefined) {
      updateSet.location = location || "";
    }

    const profile = await UserProfile.findOneAndUpdate(
      { uid },
      {
        $set: updateSet,
        $setOnInsert: {
          weeklyPay: 0,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ message: "Failed to save profile", error: error.message });
  }
});

app.get("/api/users/:uid/insurance", async (req, res) => {
  try {
    const { uid } = req.params;
    const profile = await UserProfile.findOne({ uid }, { weeklyPay: 1, _id: 0 }).lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json({ weeklyPay: profile.weeklyPay || 0 });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch insurance", error: error.message });
  }
});

app.put("/api/users/:uid/insurance", async (req, res) => {
  try {
    const { uid } = req.params;
    const parsedWeeklyPay = Number(req.body.weeklyPay);

    if (Number.isNaN(parsedWeeklyPay) || parsedWeeklyPay < 0) {
      return res.status(400).json({ message: "weeklyPay must be a non-negative number" });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { uid },
      { $set: { weeklyPay: parsedWeeklyPay } },
      { upsert: false, new: true, runValidators: true }
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json({ weeklyPay: profile.weeklyPay || 0 });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update insurance", error: error.message });
  }
});

app.get("/api/dashboard-summary", async (req, res) => {
  try {
    const { uid } = req.query;
    const [userData, orderCount, claimCount, recentOrders, recentClaims] = await Promise.all([
      uid ? UserProfile.findOne({ uid }).lean() : Promise.resolve(null),
      Order.countDocuments(uid ? { userUid: uid } : {}),
      Claim.countDocuments(uid ? { userUid: uid } : {}),
      Order.find(uid ? { userUid: uid } : {})
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Claim.find(uid ? { userUid: uid } : {})
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    return res.json({
      protectedDrivers: orderCount,
      activePolicies: orderCount,
      openClaims: claimCount,
      weatherAlerts: claimCount > 0 ? 1 : 0,
      weeklyPay: userData?.weeklyPay || 0,
      userName: userData?.name || null,
      recentOrders,
      recentClaims,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const { uid } = req.query;
    const orders = await Order.find(uid ? { userUid: uid } : {})
      .sort({ createdAt: -1 })
      .lean();

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { orderId, zone, eta, value, risk, userUid } = req.body;

    if (!orderId || !zone || !eta || value === undefined || !risk) {
      return res.status(400).json({ message: "orderId, zone, eta, value, and risk are required" });
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          orderId,
          zone,
          eta,
          value: Number(value),
          risk,
          userUid: userUid || "",
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to save order", error: error.message });
  }
});

app.get("/api/claims", async (req, res) => {
  try {
    const { uid } = req.query;
    const claims = await Claim.find(uid ? { userUid: uid } : {})
      .sort({ createdAt: -1 })
      .lean();

    return res.json(claims.map(mapClaimForResponse));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch claims", error: error.message });
  }
});

app.get("/api/claims/:claimId", async (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = await Claim.findOne({ claimId }).lean();

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.json(mapClaimForResponse(claim));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch claim", error: error.message });
  }
});

app.post("/api/claims", async (req, res) => {
  try {
    const {
      claimId,
      date,
      reason,
      amount,
      status,
      userUid,
      incidentType,
      incidentDate,
      location,
      priority,
      currentStep,
      sla,
      notes,
    } = req.body;

    if ((!date && !incidentDate) || !reason || amount === undefined) {
      return res.status(400).json({ message: "date/incidentDate, reason, and amount are required" });
    }

    const resolvedClaimId = claimId || generateClaimId();
    const filedDate = date || incidentDate;
    const resolvedStatus = normalizeClaimStatus(status || "Submitted");
    const initialTimeline = [
      {
        eventType: "fnol",
        message: "FNOL submitted by claimant",
        actor: userUid ? "user" : "system",
        createdAt: new Date(),
      },
    ];

    if (notes) {
      initialTimeline.push({
        eventType: "note",
        message: String(notes).trim(),
        actor: "user",
        createdAt: new Date(),
      });
    }

    const claim = await Claim.findOneAndUpdate(
      { claimId: resolvedClaimId },
      {
        $set: {
          claimId: resolvedClaimId,
          date: filedDate,
          reason,
          amount: Number(amount),
          status: resolvedStatus,
          userUid: userUid || "",
          incidentType: incidentType || reason,
          incidentDate: incidentDate || filedDate,
          location: location || "",
          priority: priority || "Medium",
          currentStep: currentStep || "fnol",
          sla: sla || "Pending assignment",
        },
        $setOnInsert: {
          timeline: initialTimeline,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return res.status(201).json(mapClaimForResponse(claim));
  } catch (error) {
    return res.status(500).json({ message: "Failed to save claim", error: error.message });
  }
});

app.patch("/api/claims/:claimId", async (req, res) => {
  try {
    const { claimId } = req.params;
    const {
      reason,
      amount,
      status,
      incidentType,
      incidentDate,
      location,
      priority,
      currentStep,
      sla,
    } = req.body;

    const updateSet = {};

    if (reason !== undefined) updateSet.reason = reason;
    if (amount !== undefined) updateSet.amount = Number(amount);
    if (status !== undefined) updateSet.status = normalizeClaimStatus(status);
    if (incidentType !== undefined) updateSet.incidentType = incidentType;
    if (incidentDate !== undefined) updateSet.incidentDate = incidentDate;
    if (location !== undefined) updateSet.location = location;
    if (priority !== undefined) updateSet.priority = priority;
    if (currentStep !== undefined) updateSet.currentStep = currentStep;
    if (sla !== undefined) updateSet.sla = sla;

    const claim = await Claim.findOneAndUpdate(
      { claimId },
      { $set: updateSet },
      { new: true, runValidators: true }
    ).lean();

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.json(mapClaimForResponse(claim));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update claim", error: error.message });
  }
});

app.post("/api/claims/:claimId/documents", async (req, res) => {
  try {
    const { claimId } = req.params;
    const { name, url, uploadedBy } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const document = {
      name,
      url: url || "",
      uploaded: true,
      uploadedBy: uploadedBy || "user",
      uploadedAt: new Date(),
    };

    const claim = await Claim.findOneAndUpdate(
      { claimId },
      {
        $push: {
          documents: document,
          timeline: {
            eventType: "document",
            message: `Document uploaded: ${name}`,
            actor: uploadedBy || "user",
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.status(201).json(mapClaimForResponse(claim));
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload claim document", error: error.message });
  }
});

app.post("/api/claims/:claimId/notes", async (req, res) => {
  try {
    const { claimId } = req.params;
    const { message, actor } = req.body;

    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const claim = await Claim.findOneAndUpdate(
      { claimId },
      {
        $push: {
          timeline: {
            eventType: "note",
            message,
            actor: actor || "user",
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.status(201).json(mapClaimForResponse(claim));
  } catch (error) {
    return res.status(500).json({ message: "Failed to add claim note", error: error.message });
  }
});

app.post("/api/claims/:claimId/decision", async (req, res) => {
  try {
    const { claimId } = req.params;
    const { decision, message, actor } = req.body;

    if (!["Approved", "Rejected", "More Info Needed"].includes(decision)) {
      return res.status(400).json({ message: "decision must be Approved, Rejected, or More Info Needed" });
    }

    const step = decision === "Approved" ? "settlement" : "decision";
    const claim = await Claim.findOneAndUpdate(
      { claimId },
      {
        $set: {
          status: decision,
          currentStep: step,
          sla: decision === "More Info Needed" ? "Waiting on claimant response" : "Decision completed",
        },
        $push: {
          timeline: {
            eventType: "decision",
            message: message || `Decision set to ${decision}`,
            actor: actor || "adjuster",
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.status(201).json(mapClaimForResponse(claim));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update claim decision", error: error.message });
  }
});

app.post("/api/claims/:claimId/settlement", async (req, res) => {
  try {
    const { claimId } = req.params;
    const { method, reference, actor } = req.body;

    if (!method) {
      return res.status(400).json({ message: "method is required" });
    }

    const claim = await Claim.findOneAndUpdate(
      { claimId },
      {
        $set: {
          status: "Settled",
          currentStep: "closure",
          settlementMethod: method,
          settlementReference: reference || "",
          sla: "Settled",
        },
        $push: {
          timeline: {
            eventType: "settlement",
            message: `Settlement processed via ${method}${reference ? ` (${reference})` : ""}`,
            actor: actor || "finance",
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    return res.status(201).json(mapClaimForResponse(claim));
  } catch (error) {
    return res.status(500).json({ message: "Failed to settle claim", error: error.message });
  }
});
