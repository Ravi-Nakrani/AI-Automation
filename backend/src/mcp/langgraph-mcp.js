import { MCPAdapter } from "@langchain/mcp-adapters";
import { fileURLToPath } from "node:url";
import path from "node:path";

const _fileName = fileURLToPath(import.meta.url);
const direName = path.dirname(_fileName);
const serverPath = path.join(direName, "server.js");

const adapter = new MCPAdapter({
  prefixToolNameWithServerName: false,
  servers: {
    automat: {
      transport: "stdio",
      command: process.execPath,
      args: [serverPath],
    },
  },
});

export const getMcpTools = async () => {
  const tools = await adapter.listTools();
  return tools;
};
