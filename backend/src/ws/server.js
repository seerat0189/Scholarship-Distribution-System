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

// Map: "role_id" -> socketId
const clients = new Map();

// Track online IDs per role for quick lookup
const onlineUsers = new Set();
const onlineOrgs = new Set();

// --- REDIS PUB/SUB BRIDGE ---
redis.subscribe("admin:notifications", (err) => {
  if (err) console.error("❌ Redis Subscription Error:", err.message);
});

redis.on("message", (channel, message) => {
  if (channel === "admin:notifications") {
    const notificationData = JSON.parse(message);
    io.to("admins").emit("admin:notification", notificationData);
  }
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // --- 1. REGISTRATION & PRESENCE ---
  socket.on("register", ({ id, role }) => {
    const standardizedRole = role.toLowerCase();
    const key = `${standardizedRole}_${id}`;
    
    clients.set(key, socket.id);
    console.log(`✅ Registered ${key}`);

    if (standardizedRole === "user") {
      socket.join("role:users");
      onlineUsers.add(id);
      // Notify all organizations that this user is online
      io.to("role:organizations").emit("user_status", { userId: id, status: true });
      // Send current online orgs to this user
      socket.emit("online_orgs_list", Array.from(onlineOrgs));
      
    } else if (standardizedRole === "organization") {
      socket.join("role:organizations");
      onlineOrgs.add(id);
      // Notify all users that this org is online
      io.to("role:users").emit("org_status", { orgId: id, status: true });
      // Send current online users to this org
      socket.emit("online_users_list", Array.from(onlineUsers));
    }
  });

  // --- 2. CHAT MESSAGING ---
  socket.on("send_message", async (data) => {
    const { senderId, senderRole, receiverId, receiverRole, message } = data;

    let dbUserId, dbOrganizationId, dbSenderEnum;

    // Normalize IDs for DB
    if (senderRole.toLowerCase() === "user") {
      dbUserId = parseInt(senderId);
      dbOrganizationId = parseInt(receiverId);
      dbSenderEnum = "USER";
    } else {
      dbOrganizationId = parseInt(senderId);
      dbUserId = parseInt(receiverId);
      dbSenderEnum = "ORGANIZATION";
    }

    try {
      await prisma.chatMessage.create({
        data: {
          userId: dbUserId,
          organizationId: dbOrganizationId,
          sender: dbSenderEnum,
          message: message,
        },
      });
    } catch (e) {
      console.error("❌ DB Save Error:", e.message);
    }

    // Forward to receiver
    const receiverKey = `${receiverRole.toLowerCase()}_${receiverId}`;
    const receiverSocketId = clients.get(receiverKey);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", data);
    }
  });

  // --- 3. ADMIN LOGIC ---
  socket.on("identify", () => {
    socket.join("admins");
  });

  socket.on("admin:notify", async (data) => {
    try {
      const savedNotification = await prisma.notification.create({
        data: { message: data.message, type: data.type || "INFO" },
      });
      io.to("admins").emit("admin:notification", savedNotification);
    } catch (error) {
      console.error("❌ Notification Save Error:", error.message);
    }
  });

  // --- 4. DISCONNECT ---
  socket.on("disconnect", () => {
    let disconnectedKey = null;
    let disconnectedRole = null;
    let disconnectedId = null;

    // Find who disconnected
    for (let [key, value] of clients.entries()) {
      if (value === socket.id) {
        disconnectedKey = key;
        const parts = key.split("_");
        disconnectedRole = parts[0];
        disconnectedId = parseInt(parts[1]);
        clients.delete(key);
        break;
      }
    }

    if (disconnectedRole === "user") {
      onlineUsers.delete(disconnectedId);
      io.to("role:organizations").emit("user_status", { userId: disconnectedId, status: false });
    } else if (disconnectedRole === "organization") {
      onlineOrgs.delete(disconnectedId);
      io.to("role:users").emit("org_status", { orgId: disconnectedId, status: false });
    }

    console.log("Disconnected:", socket.id);
  });
});

const PORT = 4001;
server.listen(PORT, () => console.log(`🚀 WebSocket Server running on :${PORT}`));