const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http"); // <-- For socket integration
const { PrismaClient } = require("@prisma/client"); // Prisma ORM

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const companyRoutes = require("./routes/organizationRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const errorHandler = require("./middleware/errorMiddleware.js");
const { attachSocket } = require("./admin/socket.js"); // <-- For WebSocket setup
const { getClient: getRedis } = require("./admin/redisClient.js"); // <-- For Redis Singleton

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ===================== ROUTES =====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/admin", adminRoutes);

// ===================== ERROR HANDLER =====================
app.use(errorHandler);

// ===================== HTTP SERVER + SOCKET.IO =====================
// Instead of app.listen(), explicitly create server to attach Socket.IO
const server = http.createServer(app);

// Attach Socket.IO (for real-time admin dashboard, notifications, etc.)
attachSocket(server);

// ===================== START SERVER =====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ===================== GRACEFUL SHUTDOWN =====================
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
