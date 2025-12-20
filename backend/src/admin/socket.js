// const { Server } = require("socket.io");
// const { publish, subscribe } = require("./pubsub");
// const prisma = require("../models/prismaClient"); // Use the shared Prisma instance

// let ioInstance = null;

// // Store chat clients: Map<"ROLE_ID", socketId>
// const clients = new Map();

// function attachSocket(server) {
//   if (ioInstance) return ioInstance;

//   const io = new Server(server, {
//     cors: {
//       origin: "*", // Allow all origins (adjust for production)
//       methods: ["GET", "POST"],
//     },
//   });

//   ioInstance = io;

//   io.on("connection", (socket) => {
//     console.log("Socket connected:", socket.id);

//     // ===========================
//     // 1. ADMIN LOGIC
//     // ===========================
//     socket.on("identify", (data) => {
//       // In a real app, you might verify a token here
//       socket.join("admins");
//       console.log(`Socket ${socket.id} joined admin room`);
//     });

//     socket.on("admin:notify", (data) => {
//       // Publish to Redis so other server instances know (if scaling)
//       publish("admin:notifications", data);
//     });

//     // ===========================
//     // 2. CHAT LOGIC (Merged from ws/server.js)
//     // ===========================
//     socket.on("register", ({ id, role }) => {
//       // Create a unique key like "user_1" or "organization_2"
//       const key = `${role.toLowerCase()}_${id}`;
//       clients.set(key, socket.id);
//       console.log(`Registered chat user: ${key} on socket ${socket.id}`);
//     });

//     socket.on("send_message", async (data) => {
//       const { senderId, senderRole, receiverId, receiverRole, message } = data;
//       console.log("Message received:", data);

//       // Save to Database
//       try {
//         await prisma.chatMessage.create({
//           data: {
//             senderId: parseInt(senderId),
//             receiverId: parseInt(receiverId),
//             message,
//           },
//         });
//       } catch (e) {
//         console.error("DB Error saving message:", e.message);
//       }

//       // Determine Receiver Key (e.g., "organization_2")
//       const receiverKey = `${receiverRole.toLowerCase()}_${receiverId}`;
//       const recvSocketId = clients.get(receiverKey);

//       // Send to Receiver if online
//       if (recvSocketId) {
//         io.to(recvSocketId).emit("receive_message", data);
//       }

//       // Send back to Sender (so their UI updates immediately)
//       io.to(socket.id).emit("receive_message", data);
//     });

//     // ===========================
//     // 3. DISCONNECT LOGIC
//     // ===========================
//     socket.on("disconnect", () => {
//       // Remove from clients map if it exists
//       for (let [key, value] of clients.entries()) {
//         if (value === socket.id) {
//           clients.delete(key);
//           console.log(`Removed ${key} from chat clients`);
//         }
//       }
//       console.log("Socket disconnected:", socket.id);
//     });
//   });

//   // Subscribe to Redis broadcasts (Admin feature)
//   subscribe("admin:notifications", (msg) => {
//     io.to("admins").emit("admin:notification", msg);
//   });

//   return io;
// }

// module.exports = { attachSocket };
import { io } from "socket.io-client";

// Ensure this matches your backend port (5002)
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5002";

export const adminSocket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: false,
  // 'websocket' transport is more stable than polling
  transports: ["websocket"], 
});

// Helper to authenticate and join admin room
export function connectAdminSocket(token) {
  if (!adminSocket.connected) {
    adminSocket.connect();
    adminSocket.emit("identify", { token });
  }
}