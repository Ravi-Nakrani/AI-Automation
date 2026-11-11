import api from "@/lib/api";

/**
 * Creates a new agent configuration.
 */
export const createAgent = async (agentData) => {
  const response = await api.post("/agents", agentData);
  return response.data;
};

/**
 * Fetches all agents belonging to the authenticated user.
 */
export const getAllAgents = async (signal) => {
  const response = await api.get("/agents", { signal });
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Fetches a single agent by ID.
 */
export const getAgentById = async (agentId, signal) => {
  const response = await api.get(`/agents/${agentId}`, { signal });
  return response.data;
};

/**
 * Deletes an agent by ID.
 */
export const deleteAgent = async (agentId) => {
  const response = await api.delete(`/agents/${agentId}`);
  return response.data ?? true;
};
