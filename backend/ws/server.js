const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const clients = new Map();

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("register", ({ id, role }) => {
    clients.set(`${role}_${id}`, socket.id);
    console.log(`Registered ${role}_${id}`);
  });

  socket.on("send_message", async (data) => {
    const { senderId, senderRole, receiverId, receiverRole, message } = data;
    console.log("Message:", data);

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

  socket.on("disconnect", () => {
    for (let [key, value] of clients.entries()) {
      if (value === socket.id) clients.delete(key);
    }
    console.log("Disconnected:", socket.id);
  });
});

server.listen(4001, () => console.log("WS running on :4001"));