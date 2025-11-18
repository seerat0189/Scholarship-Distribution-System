import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api/admin";

export const getAdminStats = async (token) => {
  const res = await axios.get(`${BASE_URL}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getAllUsers = async (token) => {
  const res = await axios.get(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const fromCache = res.headers["x-cache"] === "HIT";
  return { data: res.data, fromCache };
};

export const notifyAdmins = async (token, payload) => {
  return axios.post(`${BASE_URL}/notify`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const reindexUser = async (token, id) => {
  return axios.post(`${BASE_URL}/reindex-user/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const flushCache = async (token) => {
  return axios.post(`${BASE_URL}/cache/flush`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
