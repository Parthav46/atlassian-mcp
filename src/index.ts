#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./registerTools.js";

const server = new McpServer({
  name: "confluence",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});