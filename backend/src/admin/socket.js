const { createServer } = require("http");
const { Server } = require("socket.io");
const { getClient } = require("./redisClient");
const { publish, subscribe } = require("./pubsub");

let ioInstance = null;

/**
 * attachSocket(server) -> attaches socket on the provided http.Server instance
 * Use from your main entry (index.js) after creating the express app and http server
 */
function attachSocket(httpServer) {
  if (ioInstance) return ioInstance;

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*", // restrict in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[SOCKET] Admin socket connected:", socket.id);

    /**
     * Admin identifies themself
     * The admin dashboard calls socket.emit("identify")
     */
    socket.on("identify", (payload) => {
      // Normally validate token; for demo we allow it
      socket.join("admins");
      console.log("[SOCKET] Admin joined admin room:", socket.id);
    });

    /**
     * Admin triggered notification (optional feature)
     */
    socket.on("admin:notify", (data) => {
      console.log("[PUBSUB] Admin requested notify:", data);

      // publish to Redis so that all server instances receive this notification
      publish("admin:notifications", {
        type: "manual_notification",
        data,
        timestamp: new Date(),
      });
    });

    socket.on("disconnect", () => {
      console.log("[SOCKET] Admin disconnected:", socket.id);
    });
  });

  // 🔥 STEP 7: Subscribe to Redis pub/sub events and broadcast them to connected admin sockets
  subscribe("admin:notifications", (msg) => {
    console.log("[PUBSUB] Received broadcast:", msg);

    // Send to all admin sockets
    io.to("admins").emit("admin:notification", msg);
  });

  ioInstance = io;
  return io;
}

module.exports = { attachSocket, getIO: () => ioInstance };
