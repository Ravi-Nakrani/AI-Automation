import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const baseURL = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

let unauthorizedHandler = null;

/**
 * Registers a callback invoked when an authenticated API request receives 401.
 */
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

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
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const requestUrl = error.config?.url || "";
    if (
      error.response?.status === 401 &&
      typeof unauthorizedHandler === "function" &&
      !requestUrl.includes("/auth/profile") &&
      !requestUrl.includes("/auth/login")
    ) {
      unauthorizedHandler();
    }

    const customMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected server error occurred";
    const rawRetryAfter =
      error.response?.data?.retryAfter ??
      error.response?.headers?.["retry-after"];
    const parsedRetryAfter = Number(rawRetryAfter);

    const customError = new Error(customMessage);
    customError.status = error.response?.status;
    customError.code = error.code;
    customError.serverCode = error.response?.data?.code || null;
    customError.retryAfter =
      Number.isFinite(parsedRetryAfter) && parsedRetryAfter > 0
        ? Math.ceil(parsedRetryAfter)
        : null;
    customError.data = error.response?.data;
    customError.originalError = error;
    return Promise.reject(customError);
  },
);

export default api;
