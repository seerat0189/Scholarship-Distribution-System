import axios from "axios";

// Use Vite's environment variable feature. 
// If VITE_API_URL is set, use it; otherwise fallback to localhost (for local dev).
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: baseURL, 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;