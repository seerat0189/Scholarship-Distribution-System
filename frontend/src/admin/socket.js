import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const adminSocket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: false,
});

// authenticate and join admin room after login
export function connectAdminSocket(token) {
  adminSocket.connect();
  adminSocket.emit("identify", { token });
}
