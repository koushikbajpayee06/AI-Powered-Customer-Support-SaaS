import "dotenv/config";
import { createClient } from "redis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing");
}

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error.message);
});

export default redisClient;