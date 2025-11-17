const { createServer } = require("http");
const { Server } = require("socket.io");
const { getClient } = require("./redisClient");
const { publish, subscribe } = require("./pubsub");

let ioInstance = null;

function attachSocket(httpServer) {
  if (ioInstance) return ioInstance;

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[SOCKET] Admin socket connected:", socket.id);

    socket.on("identify", (payload) => {
      socket.join("admins");
      console.log("[SOCKET] Admin joined admin room:", socket.id);
    });

    socket.on("admin:notify", (data) => {
      console.log("[PUBSUB] Admin requested notify:", data);

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

  subscribe("admin:notifications", (msg) => {
    console.log("[PUBSUB] Received broadcast:", msg);

    io.to("admins").emit("admin:notification", msg);
  });

  ioInstance = io;
  return io;
}

module.exports = { attachSocket, getIO: () => ioInstance };
