import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const baseURL =
  rawBaseUrl.replace(/\/+$/, "") + (rawBaseUrl.endsWith("/api") ? "" : "/api");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Normalize URLs so both "/auth/login" and "/api/auth/login" resolve seamlessly
api.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("/api/")) {
    config.url = config.url.replace(/^\/api/, "");
  }
  return config;
});

// Response interceptor to format error messages consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected server error occurred";
    const customError = new Error(customMessage);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    customError.originalError = error;
    return Promise.reject(customError);
  },
);

export default api;
