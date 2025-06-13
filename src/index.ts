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
    tools: {
      getPage: {
        description: "Get a Confluence page by ID",
        inputSchema: z.object({ pageId: z.string() }),
        outputSchema: z.any(),
        async execute(input: { pageId: string }, context: any) {
          const req = context.req;
          const config = getConfluenceConfig(req);
          const client = new ConfluenceClient(config);
          const response = await client.getPage(input.pageId);
          return response.data;
        },
      },
      updatePage: {
        description: "Update a Confluence page by ID",
        inputSchema: z.object({ pageId: z.string(), data: z.any() }),
        outputSchema: z.any(),
        async execute(input: { pageId: string; data: any }, context: any) {
          const req = context.req;
          const config = getConfluenceConfig(req);
          const client = new ConfluenceClient(config);
          const response = await client.updatePage(input.pageId, input.data);
          return response.data;
        },
      },
      getChildren: {
        description: "Get children of a Confluence page by ID",
        inputSchema: z.object({ pageId: z.string() }),
        outputSchema: z.any(),
        async execute(input: { pageId: string }, context: any) {
          const req = context.req;
          const config = getConfluenceConfig(req);
          const client = new ConfluenceClient(config);
          const response = await client.getChildren(input.pageId);
          return response.data;
        },
      },
      getFolder: {
        description: "Get a Confluence folder by ID",
        inputSchema: z.object({ folderId: z.string() }),
        outputSchema: z.any(),
        async execute(input: { folderId: string }, context: any) {
          const req = context.req;
          const config = getConfluenceConfig(req);
          const client = new ConfluenceClient(config);
          const response = await client.getFolder(input.folderId);
          return response.data;
        },
      },
      getSpace: {
        description: "Get a Confluence space by ID",
        inputSchema: z.object({ spaceId: z.string() }),
        outputSchema: z.any(),
        async execute(input: { spaceId: string }, context: any) {
          const req = context.req;
          const config = getConfluenceConfig(req);
          const client = new ConfluenceClient(config);
          const response = await client.getSpace(input.spaceId);
          return response.data;
        },
      },
    },
  },
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});