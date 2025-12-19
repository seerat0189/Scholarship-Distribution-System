// import { io } from "socket.io-client";

// //const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;
// export const adminSocket = io(SOCKET_URL, {
//   path: "/socket.io",
//   autoConnect: false,
// });

// // authenticate and join admin room after login
// export function connectAdminSocket(token) {
//   adminSocket.connect();
//   adminSocket.emit("identify", { token });
// }
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

export const adminSocket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: false,
  withCredentials: true,
});

// Call this AFTER successful login
export function connectAdminSocket({ id, role }) {
  adminSocket.connect();
  adminSocket.emit("identify", { id, role });
}
