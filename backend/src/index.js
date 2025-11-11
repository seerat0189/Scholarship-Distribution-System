const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const companyRoutes = require("./routes/organizationRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Middleware
const errorHandler = require("./middleware/errorMiddleware");


const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Basic route to verify server and DB connection
app.get("/", async (req, res) => {
  try {
    await prisma.$connect(); // Check DB connection
    res.json({ message: "Scholarship System API running 🚀" });
  } catch (err) {
    console.error("Database connection failed ❌", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// app.get("/api/questions", (req, res) => {
//   try {
//     const questionList = questions.map(q => ({
//       id: q.id,
//       title: q.title
//     }));
//     res.json(questionList);
//   } catch (e) {
//     res.status(500).json({ error: "Failed to load questions" });
//   }
// });

// console.log({
//   authRoutes,
//   userRoutes,
//   companyRoutes,
//   adminRoutes,
// });


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);

// Error middleware
app.use(errorHandler);

// Gracefully close Prisma connection on exit
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma disconnected gracefully 🧹");
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
