const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { publish, subscribe } = require("./pubsub");

const prisma = new PrismaClient();
let ioInstance = null;
const clients = new Map();

function attachSocket(httpServer) {
  if (ioInstance) return ioInstance;

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("identify", ({ id, role }) => {
      if (!id || !role) return;
      clients.set(`${role}_${id}`, socket.id);
      socket.join(role);
    });

    socket.on("send_message", async (data) => {
      const { senderId, receiverId, message } = data;

      try {
        await prisma.chatMessage.create({
          data: { senderId, receiverId, message },
        });
      } catch (e) {
        console.error("DB Error:", e.message);
      }

      socket.emit("receive_message", data);
      socket.broadcast.emit("receive_message", data);
    });

    socket.on("admin:notify", (data) => {
      publish("admin:notifications", data);
    });

    socket.on("disconnect", () => {
      for (let [k, v] of clients.entries()) {
        if (v === socket.id) clients.delete(k);
      }
      console.log("Disconnected:", socket.id);
    });
  });

  subscribe("admin:notifications", (msg) => {
    io.to("admins").emit("admin:notification", msg);
  });

  ioInstance = io;
  return io;
}

module.exports = { attachSocket };
