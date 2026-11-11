import api from "@/lib/api";

export const sendChatMessage = async ({ message }, signal) => {
  const response = await api.post(
    "/chat",
    {
      message,
    },
    { signal },
  );
  return response.data;
};

export const sendAgentMessage = async ({ message, agentId = null }, signal) => {
  const response = await api.post(
    "/chat/agent",
    {
      message,
      agentId,
    },
    { signal },
  );
  return response.data;
};
