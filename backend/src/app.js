const express = require("express");
const cors = require("cors");
const http = require("http");
const { attachSocket } = require("./admin/socket.js");
const errorHandler = require("./middleware/errorMiddleware.js");

// Import Routes
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const companyRoutes = require("./routes/organizationRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/admin", adminRoutes);

// Health Check Route
app.get("/", (req, res) => res.status(200).json({ status: "OK", message: "Server is running" }));

// Error Handler
app.use(errorHandler);

// Create HTTP Server & Attach Socket
const server = http.createServer(app);
attachSocket(server);

module.exports = { app, server };
