import { app, connectToMongo } from "../server/app.js";

export default async function handler(req, res) {
  try {
    await connectToMongo();
    return app(req, res);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to initialize API",
      error: error.message,
    });
  }
}
