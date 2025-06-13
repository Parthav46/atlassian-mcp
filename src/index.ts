import * as dotenv from 'dotenv';
dotenv.config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getConfluenceConfig } from "../config/confluence";
import { ConfluenceClient } from "./confluenceClient";
import { JiraClient } from "./jiraClient";
import { registerTools } from "./registerTools.js";

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

// Helper to get Jira config from extra.request.headers
function getJiraConfigFromExtra(extra: any) {
  const headers = (extra?.request?.headers || {}) as Record<string, string>;
  const baseUrl = headers['x-jira-base-url'] || process.env.JIRA_BASE_URL || '';
  let userToken = '';
  const authHeader = headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userToken = authHeader.replace('Bearer ', '').trim();
  } else if (headers['x-jira-token']) {
    userToken = headers['x-jira-token'];
  } else if (process.env.JIRA_USER_TOKEN) {
    userToken = process.env.JIRA_USER_TOKEN;
  }
  return { baseUrl, userToken };
}

registerTools(server);

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