
export const AGENT_TOOLS = [
  { id: "web_search", label: "Web Search", available: true },
  { id: "code_interpreter", label: "Code Interpreter", available: false },
  { id: "file_reader", label: "File Reader", available: false },
  { id: "database_query", label: "Database Query", available: false },
  { id: "api_caller", label: "API Caller", available: false },
  { id: "slack_notifier", label: "Slack Notifier", available: false },
  { id: "email_sender", label: "Email Sender", available: false },
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
