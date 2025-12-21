// src/index.js
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

/**
 * ✅ Load dotenv ONLY outside test environment
 */
if (process.env.NODE_ENV !== "test") {
  require("dotenv").config();
}

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

app.use(errorHandler);

/**
 * ✅ Do NOT start server in tests
 */
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
