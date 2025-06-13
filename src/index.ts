import * as dotenv from 'dotenv';
dotenv.config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getConfluenceConfig } from "../config/confluence";
import { ConfluenceClient } from "./confluenceClient";

const server = new McpServer({
  name: "confluence",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper to get config from extra.request.headers
function getConfigFromExtra(extra: any) {
  const headers = (extra?.request?.headers || {}) as Record<string, string>;
  const baseUrl = headers['x-confluence-base-url'] || process.env.CONFLUENCE_BASE_URL || '';
  let userToken = '';
  const authHeader = headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userToken = authHeader.replace('Bearer ', '').trim();
  } else if (headers['x-confluence-token']) {
    userToken = headers['x-confluence-token'];
  } else if (process.env.CONFLUENCE_USER_TOKEN) {
    userToken = process.env.CONFLUENCE_USER_TOKEN;
  }
  return { baseUrl, userToken };
}

// Register Confluence tools using the correct server.tool format
server.tool(
  "get-page",
  "Get a Confluence page by ID",
  { pageId: z.string().describe("Confluence page ID") },
  async ({ pageId }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.getPage(pageId);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "update-page",
  "Update a Confluence page by ID",
  { pageId: z.string().describe("Confluence page ID"), data: z.any().describe("Page update data") },
  async ({ pageId, data }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.updatePage(pageId, data);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "get-children",
  "Get children of a Confluence page by ID",
  { pageId: z.string().describe("Confluence page ID") },
  async ({ pageId }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.getChildren(pageId);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "get-folder",
  "Get a Confluence folder by ID",
  { folderId: z.string().describe("Confluence folder ID") },
  async ({ folderId }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.getFolder(folderId);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "get-space",
  "Get a Confluence space by ID",
  { spaceId: z.string().describe("Confluence space ID") },
  async ({ spaceId }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.getSpace(spaceId);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "list-spaces",
  "List all Confluence spaces",
  { start: z.number().optional().describe("Start index"), limit: z.number().optional().describe("Page size limit") },
  async ({ start, limit }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.listSpaces(start, limit);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "create-page",
  "Create a new Confluence page",
  { spaceId: z.string().describe("Space ID"), title: z.string().describe("Page title"), body: z.string().describe("Page body (HTML or storage format)"), parentId: z.string().optional().describe("Parent page ID") },
  async ({ spaceId, title, body, parentId }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.createPage(spaceId, title, body, parentId);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "delete-page",
  "Delete a Confluence page by ID",
  { pageId: z.string().describe("Confluence page ID") },
  async ({ pageId }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.deletePage(pageId);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

server.tool(
  "search-pages-by-title",
  "Search Confluence pages by title",
  { title: z.string().describe("Page title") },
  async ({ title }, extra) => {
    const config = getConfigFromExtra(extra);
    const client = new ConfluenceClient(config);
    const response = await client.searchPagesByTitle(title);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }
);

console.error("DEBUG: Registered tools:", Object.keys(server.tool));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});