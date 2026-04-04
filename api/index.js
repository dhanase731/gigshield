import { app, connectToMongo } from "../server/app.js";

export default async function handler(req, res) {
  try {
    await connectToMongo();
    return app(req, res);
  } catch (error) {
    const details = error?.message || "Unknown API initialization error";

    return res.status(500).json({
      message: details,
      error: details,
    });
  }
}
