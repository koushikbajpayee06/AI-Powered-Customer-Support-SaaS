import redisClient from "./config/redis.js";

try {
  await redisClient.connect();

    await redisClient.set("practice:message", "Hello Redis", {
    EX: 60,
    });

    const message = await redisClient.get("practice:message");
    const remainingTime = await redisClient.ttl("practice:message");

    console.log("Message:", message);
    console.log("Expires in:", remainingTime, "seconds");
} catch (error) {
  console.error("Redis check failed:", error.message);
  process.exitCode = 1;
} finally {
  if (redisClient.isOpen) {
    await redisClient.close();
  }
}