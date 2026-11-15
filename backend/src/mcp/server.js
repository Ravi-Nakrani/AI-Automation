import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const _fileName = fileURLToPath(import.meta.url);
const direName = path.dirname(_fileName);

dotenv.config({
  path: path.resolve(direName, "../../.env"),
});
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";

const server = new McpServer({
  name: "ai-automation-mcp-server",
  version: "1.0.0",
});

let tavilySearchTool = null;

const getTavilySearchTool = () => {
  if (!tavilySearchTool) {
    const apiKey = process.env.TAVILY_API_KEY?.trim()?.replace(
      /^["']|["']$/g,
      "",
    );
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY environment variable is missing.");
    }
    tavilySearchTool = new TavilySearch({
      apiKey,
      maxResults: 3,
      topic: "general",
    });
  }
  return tavilySearchTool;
};

const compactSearchResult = (result) => {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return String(result ?? "");

  if (Array.isArray(result.results)) {
    return JSON.stringify({
      query: result.query,
      answer: result.answer,
      results: result.results.map(({ title, url, content }) => ({
        title,
        url,
        content: typeof content === "string" ? content.slice(0, 600) : content,
      })),
    });
  }

  return JSON.stringify(result);
};

server.registerTool(
  "web_search",
  {
    description:
      "Search the web for current latest information, tutorials and news",
    inputSchema: z.object({
      query: z.string(),
    }),
  },
  async ({ query }) => {
    try {
      const tool = getTavilySearchTool();
      const result = await tool.invoke({ query });
      if (result && typeof result === "object" && result.error) {
        return {
          isError: true,
          content: [{ type: "text", text: String(result.error) }],
        };
      }

      return {
        content: [{ type: "text", text: compactSearchResult(result) }],
      };
    } catch (error) {
      console.error("web_search tool error:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Web search error: ${error.message || "Search failed."}`,
          },
        ],
      };
    }
  },
);

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp server started");
};

main().catch((error) => {
  console.error("mcp server error", error);
  process.exit(1);
});
