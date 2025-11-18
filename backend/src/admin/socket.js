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
      origin: "*", // restrict in prod
      methods: ["GET", "POST"],
    },
  });

  // If you want Socket.IO Redis adapter (multi-node), uncomment below and install adapter
  // const { createAdapter } = require("@socket.io/redis-adapter");
  // const pubClient = getClient();
  // const subClient = pubClient.duplicate();
  // io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("Admin socket connected:", socket.id);

    // authenticate admin socket connections (example)
    socket.on("identify", (payload) => {
      // payload should contain token/role; validate token and roles as appropriate
      // For demo, allow it
      socket.join("admins");
    });

    // Example event: broadcast notification to admins
    socket.on("admin:notify", (data) => {
      // publish via redis pubsub so other nodes can pick it up too
      publish("admin:notifications", data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  // Subscribe to redis broadcasts and forward to sockets
  subscribe("admin:notifications", (msg) => {
    io.to("admins").emit("admin:notification", msg);
  });

  ioInstance = io;
  return io;
}

module.exports = { attachSocket, getIO: () => ioInstance };
