const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const companyRoutes = require("./routes/organizationRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const errorHandler = require("./middleware/errorMiddleware.js");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/admin", adminRoutes);

// Error Handling
app.use(errorHandler);

// Start Server on Port 5001
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("\n🧹 Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});