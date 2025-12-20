const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { getClient: getRedis } = require("../admin/redisClient");

const redis = getRedis();
const prisma = new PrismaClient();
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const clients = new Map();

// --- REDIS PUB/SUB BRIDGE ---
// This listens for notifications sent from the adminController via Redis
redis.subscribe("admin:notifications", (err) => {
  if (err) console.error("❌ Redis Subscription Error:", err.message);
});

redis.on("message", (channel, message) => {
  if (channel === "admin:notifications") {
    const notificationData = JSON.parse(message);
    // Broadcast to everyone in the 'admins' room
    io.to("admins").emit("admin:notification", notificationData);
    console.log("📢 Broadcasted notification via Redis Pub/Sub");
  }
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // --- 1. CHAT LOGIC ---
  socket.on("register", ({ id, role }) => {
    clients.set(`${role}_${id}`, socket.id);
    console.log(`Registered ${role}_${id}`);
  });

  socket.on("send_message", async (data) => {
    const { senderId, senderRole, receiverId, receiverRole, message } = data;
    try {
      await prisma.chatMessage.create({
        data: { senderId, receiverId, message },
      });
    } catch (e) {
      console.error("DB Error:", e.message);
    }

    const recvSocket = clients.get(`${receiverRole}_${receiverId}`);
    if (recvSocket) io.to(recvSocket).emit("receive_message", data);
    io.to(socket.id).emit("receive_message", data);
  });

  // --- 2. ADMIN LOGIC ---
  socket.on("identify", () => {
    socket.join("admins");
    console.log(`Socket ${socket.id} joined admin room`);
  });

  // Note: This is for direct socket-to-socket admin triggers
  socket.on("admin:notify", async (data) => {
    try {
      const savedNotification = await prisma.notification.create({
        data: {
          message: data.message,
          type: data.type || "INFO"
        }
      });
      io.to("admins").emit("admin:notification", savedNotification);
    } catch (error) {
      console.error("❌ Notification Save Error:", error.message);
    }
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    for (let [key, value] of clients.entries()) {
      if (value === socket.id) clients.delete(key);
    }
    console.log("Disconnected:", socket.id);
  });
});

server.listen(4001, () => console.log("🚀 WS running on :4001"));