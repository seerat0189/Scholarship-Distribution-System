import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api/admin";

// ---------------------
// Admin Stats
// ---------------------
export const getAdminStats = async (token) => {
  const res = await axios.get(`${BASE_URL}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ---------------------
// Get All Users (with cache detection)
// ---------------------
export const getAllUsers = async (token) => {
  const res = await axios.get(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const fromCache = res.headers["x-cache"] === "HIT";
  return { data: res.data, fromCache };
};

// ---------------------
// Notify Admins (Pub/Sub trigger)
// ---------------------
export const notifyAdmins = async (token, payload) => {
  return axios.post(`${BASE_URL}/notify`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ---------------------
// Basic Search (NO Elasticsearch)
// ---------------------
export const adminSearch = async (token, q) => {
  const res = await axios.get(`${BASE_URL}/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ---------------------
// Flush Cache
// ---------------------
export const flushCache = async (token) => {
  return axios.post(
    `${BASE_URL}/cache/flush`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

// ---------------------
// Get All Users
// ---------------------
export const getAllOrganizations = async (token) => {
  const res = await axios.get(`${BASE_URL}/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const fromCache = res.headers["x-cache"] === "HIT";
  return { data: res.data, fromCache };
};

