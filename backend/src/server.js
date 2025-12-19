const dotenv = require("dotenv");
const { server } = require("./app");
const { PrismaClient } = require("@prisma/client");
const { getClient: getRedis } = require("./admin/redisClient.js");

dotenv.config();

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Start Server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Graceful Shutdown Logic
process.on("SIGINT", async () => {
  console.log("\n🧹 Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    const redis = getRedis();
    if (redis && redis.disconnect) await redis.disconnect();
    console.log("✅ Prisma & Redis disconnected");
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
  }
  process.exit(0);
});
