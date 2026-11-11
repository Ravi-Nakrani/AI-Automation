export const AGENT_TOOLS = [
  { id: "web_search", label: "Web Search" },
  { id: "code_interpreter", label: "Code Interpreter" },
  { id: "file_reader", label: "File Reader" },
  { id: "database_query", label: "Database Query" },
  { id: "api_caller", label: "API Caller" },
  { id: "slack_notifier", label: "Slack Notifier" },
  { id: "email_sender", label: "Email Sender" },
];

const TOOL_LABEL_MAP = new Map(AGENT_TOOLS.map((tool) => [tool.id, tool.label]));

/**
 * Formats a tool ID into its human-readable label, falling back to title case.
 */
export const getAgentToolLabel = (toolId) => {
  if (TOOL_LABEL_MAP.has(toolId)) {
    return TOOL_LABEL_MAP.get(toolId);
  }
  return String(toolId)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
