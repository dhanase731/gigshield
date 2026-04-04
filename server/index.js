import { app, connectToMongo } from "./app.js";
const port = Number(process.env.API_PORT || 5000);

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
