import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const app = express();
const mongoUri = process.env.MONGODB_URI;

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

const claimSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, unique: true, index: true, trim: true },
    date: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: ["Pending", "Approved", "Processing", "Rejected"] },
    userUid: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const Claim = mongoose.models.Claim || mongoose.model("Claim", claimSchema);

app.use(cors());
app.use(express.json());

let connectionPromise = null;

export const connectToMongo = async () => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in .env");
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
          name: "User",
          phone: "",
          location: "",
          weeklyPay: 0,
        },
      },
      { upsert: true, new: true, runValidators: true }
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

    return res.json(claims);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch claims", error: error.message });
  }
});

app.post("/api/claims", async (req, res) => {
  try {
    const { claimId, date, reason, amount, status, userUid } = req.body;

    if (!claimId || !date || !reason || amount === undefined || !status) {
      return res.status(400).json({ message: "claimId, date, reason, amount, and status are required" });
    }

    const claim = await Claim.findOneAndUpdate(
      { claimId },
      {
        $set: {
          claimId,
          date,
          reason,
          amount: Number(amount),
          status,
          userUid: userUid || "",
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return res.status(201).json(claim);
  } catch (error) {
    return res.status(500).json({ message: "Failed to save claim", error: error.message });
  }
});
