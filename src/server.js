import "dotenv/config";
import app from "./app.js";
import redisClient from "./config/redis.js";

const PORT = process.env.PORT || 5000;

try {
  await redisClient.connect();

  console.log("Redis connected");

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Server startup failed:", error.message);

  if (redisClient.isOpen) {
    redisClient.destroy();
  }

  process.exitCode = 1;
}