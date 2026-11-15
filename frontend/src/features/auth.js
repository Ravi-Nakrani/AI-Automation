import api from "@/lib/api";

/**
 * Fetches the authenticated user's profile.
 * Returns null for 4xx auth/session misses; throws for network or 5xx errors.
 */
export const fetchProfile = async (signal) => {
  try {
    const response = await api.get("/auth/profile", { signal });
    return response.data;
  } catch (error) {
    if (error.status && error.status < 500) {
      return null;
    }
    throw error;
  }
};

/**
 * Exchanges a Firebase ID token for a backend session.
 */
export const login = async (firebaseToken) => {
  const response = await api.post("/auth/login", { firebaseToken });
  return response.data;
};

/**
 * Logs out the current user by clearing the backend session cookie.
 */
export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

