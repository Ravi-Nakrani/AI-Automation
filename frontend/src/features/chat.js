import api from "@/lib/api";

export const sendChatMessage = async (
  { message, agentId = null, messages = [] },
  signal,
) => {
  const response = await api.post(
    "/chat",
    {
      message,
      agentId,
      messages,
    },
    { signal },
  );
  return response.data;
};
