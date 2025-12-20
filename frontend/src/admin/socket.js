import { io } from "socket.io-client";

// FIX: Explicitly set to port 4001 to resolve connection issues
const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:4001";

export const adminSocket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: false,
  transports: ["websocket"],
});

export function connectAdminSocket(token) {
  if (!adminSocket.connected) {
    adminSocket.auth = { token }; 
    adminSocket.connect();
    adminSocket.emit("identify", { token });
  }
}