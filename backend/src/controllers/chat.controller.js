import Agent from "../models/agent.model.js";
import { createAgentGraph } from "../utils/agentGraph.js";
import chatGraph from "../utils/chatGraph.js";
import { HumanMessage } from "@langchain/core/messages";

const extractMessageText = (msg) => {
  const content = msg?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("");
  }
  return "";
};

const parseDurationSeconds = (rawValue) => {
  if (rawValue === undefined || rawValue === null) return null;
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return Math.ceil(rawValue);
  }
  const str = String(rawValue).trim();
  if (!str) return null;

  if (/^\d+(\.\d+)?$/.test(str)) {
    return Math.ceil(Number(str));
  }

  const minSecMatch = str.match(/(?:(\d+)m)?\s*(\d+(?:\.\d+)?)s/i);
  if (minSecMatch) {
    const minutes = Number(minSecMatch[1] || 0);
    const seconds = Number(minSecMatch[2] || 0);
    return Math.ceil(minutes * 60 + seconds);
  }
  return null;
};

const extractRateLimitRetryAfter = (error) => {
  const status = error?.status ?? error?.response?.status;
  const code = error?.code ?? error?.error?.error?.code;
  const name = error?.name || "";

  const isRateLimit =
    status === 429 ||
    code === "rate_limit_exceeded" ||
    name.includes("RateLimit");

  if (!isRateLimit) return null;

  const headerRetryAfter =
    error?.headers?.get?.("retry-after") ?? error?.headers?.["retry-after"];
  const headerResetTokens =
    error?.headers?.get?.("x-ratelimit-reset-tokens") ??
    error?.headers?.["x-ratelimit-reset-tokens"];
  const rawMessage = error?.error?.error?.message || error?.message || "";
  const msgMatch = rawMessage.match(/try again in\s+((?:\d+m)?\s*\d+(?:\.\d+)?s)/i);

  const parsed =
    parseDurationSeconds(headerRetryAfter) ??
    parseDurationSeconds(msgMatch?.[1]) ??
    parseDurationSeconds(headerResetTokens);

  return Math.max(1, parsed || 15);
};

const handleChatError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);

  const retryAfter = extractRateLimitRetryAfter(error);
  if (retryAfter !== null) {
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      message: `Rate limit reached. Please wait ${retryAfter}s before trying again.`,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter,
    });
  }

  return res.status(500).json({ message: fallbackMessage });
};

export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "message required" });
    }

    const threadId = "thread-" + String(req.user.id);

    const data = await chatGraph.invoke(
      {
        messages: [new HumanMessage(message)],
      },
      {
        configurable: { thread_id: threadId },
      },
    );

    const lastMessage = extractMessageText(data.messages.at(-1));
    return res.status(200).json(lastMessage);
  } catch (error) {
    return handleChatError(res, error, "chat controller error");
  }
};

export const agentChat = async (req, res) => {
  try {
    const { message, agentId } = req.body;
    if (!message || !agentId) {
      return res
        .status(400)
        .json({ message: "message and agentId are required" });
    }
    const agent = await Agent.findOne({ _id: agentId, userId: req.user.id });
    if (!agent) return res.status(404).json({ message: "agent not found" });

    const graph = await createAgentGraph(agent, req.user.id);
    const threadId = `thread-${String(req.user.id)}-${String(agent._id)}`;

    const data = await graph.invoke(
      {
        messages: [new HumanMessage(message)],
      },
      {
        configurable: { thread_id: threadId },
      },
    );

    const lastMessage = extractMessageText(data.messages.at(-1));
    if (!lastMessage.trim()) {
      return res.status(502).json({
        message: "The agent did not produce a text response. Please try again.",
      });
    }

    return res.status(200).json(lastMessage);
  } catch (error) {
    return handleChatError(res, error, "agentChat controller error");
  }
};
