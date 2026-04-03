import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 5000);
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

app.use(cors());
app.use(express.json());

const connectToMongo = async () => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || "gigshield",
  });
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

    const profile = await UserProfile.findOneAndUpdate(
      { uid },
      {
        $set: {
          uid,
          email,
          name: name || "User",
          phone: phone || "",
          location: location || "",
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
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return res.json({ weeklyPay: profile.weeklyPay || 0 });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update insurance", error: error.message });
  }
});

app.get("/api/dashboard-summary", async (req, res) => {
  try {
    const { uid } = req.query;
    const userData = uid ? await UserProfile.findOne({ uid }).lean() : null;

    return res.json({
      protectedDrivers: 128,
      activePolicies: 124,
      openClaims: 3,
      weatherAlerts: 1,
      weeklyPay: userData?.weeklyPay || 0,
      userName: userData?.name || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
  }
});

const startServer = async () => {
  try {
    await connectToMongo();
    console.log("MongoDB connected successfully");

    app.listen(port, () => {
      console.log(`GigShield backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
};

startServer();
