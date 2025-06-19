import { z } from "zod";
import { ConfluenceClient } from "../../clients/confluenceClient";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export function registerSpaceTools(server: McpServer, config: any) {
  server.tool(
    "get-folder",
    "Get a Confluence folder by ID",
    { folderId: z.number().describe("Confluence folder ID") },
    async (
      { folderId }: { folderId: number },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getFolder(folderId);
      const folder = response.data;
      const name = folder.name || folder.title || "undefined";
      const url = folder._links?.webui
        ? `${config.baseUrl}${folder._links.webui}`
        : `${config.baseUrl}/folders/${folder.id}`;
      const description = folder.description || "None";
      const text = `Folder: ${name}\nID: ${folder.id}\nURL: ${url}\nDescription: ${description}`;
      return {
        content: [
          {
            type: "text",
            text
          }
        ]
      };
    }
  );

  server.tool(
    "get-space",
    "Get a Confluence space by ID",
    { spaceId: z.number().describe("Confluence space ID") },
    async (
      { spaceId }: { spaceId: number },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getSpace(spaceId);
      const space = response.data;
      const url = space._links?.webui
        ? `${config.baseUrl}/wiki${space._links.webui}`
        : `No link available`;
      const text = `Space: ${space.name}\nKey: ${space.key}\nID: ${space.id}\nURL: ${url}\nDescription: ${space.description?.plain?.value || 'None'}`;
      return {
        content: [
          {
            type: "text",
            text
          }
        ]
      };
    }
  );

  server.tool(
    "list-spaces",
    "List all Confluence spaces (optionally filter by keys)",
    {
      start: z.number().optional().describe("Start index"),
      limit: z.number().optional().describe("Page size limit"),
      keys: z.string().optional().describe("Filter by key(s), comma-separated")
    },
    async (
      { start, limit, keys }: { start?: number; limit?: number; keys?: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.listSpaces(start, limit, keys);
      const results = response.data.results || [];
      if (!Array.isArray(results) || !results.length) {
        return {
          content: [
            {
              type: "text",
              text: "No spaces found."
            }
          ]
        };
      }
      const lines = results.map((space: any) => `- ${space.name} (KEY: ${space.key}, ID: ${space.id}): ${config.baseUrl}/spaces/${space.key}`);
      return {
        content: [
          {
            type: "text",
            text: `Spaces:\n${lines.join("\n")}`
          }
        ]
      };
    }
  );
}
