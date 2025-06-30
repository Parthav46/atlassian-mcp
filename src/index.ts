#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./registerTools";
import { registerResources } from "./registerResources";
import { readFileSync } from "fs";
import { join } from "path";

const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8")
);

const server = new McpServer({
  name: "atlassian",
  version: pkg.version || "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

registerTools(server);
registerResources(server);

// Health request handler for integration testing
if (process.env.MCP_HEALTH_ENABLED === '1') {
  server.tool(
    "health",
    "Health check for integration testing",
    {}, // No input schema needed for health check
    async () => ({
      content: [
        {
          type: "text",
          text: "ok"
        }
      ]
    })
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Atlassian MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});