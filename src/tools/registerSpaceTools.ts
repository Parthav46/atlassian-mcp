import { z } from "zod";
import { ConfluenceClient } from "./confluenceClient.js";

export function registerSpaceTools(server: any, config: any) {
  server.tool(
    "get-folder",
    "Get a Confluence folder by ID",
    { folderId: z.string().describe("Confluence folder ID") },
    async (
      { folderId }: { folderId: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getFolder(folderId);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "get-space",
    "Get a Confluence space by ID",
    { spaceId: z.string().describe("Confluence space ID") },
    async (
      { spaceId }: { spaceId: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getSpace(spaceId);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "list-spaces",
    "List all Confluence spaces",
    { start: z.number().optional().describe("Start index"), limit: z.number().optional().describe("Page size limit") },
    async (
      { start, limit }: { start?: number; limit?: number },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.listSpaces(start, limit);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "get-pages-from-space",
    "Get pages from a Confluence space (v2 API)",
    { spaceId: z.string().describe("Confluence space ID"), limit: z.number().optional().describe("Page size limit"), cursor: z.string().optional().describe("Pagination cursor") },
    async (
      { spaceId, limit, cursor }: { spaceId: string; limit?: number; cursor?: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getPagesFromSpace(spaceId, limit, cursor);
      const results = response.data.results || [];
      if (!results.length) {
        return { content: [{ type: "text", text: "No pages found in this space." }] };
      }
      const summary = results.map((page: any) => {
        const id = page.id;
        const pageTitle = page.title || "Untitled";
        const url = `${config.baseUrl}/spaces/${spaceId}/pages/${id}`;
        return `- [${pageTitle}] (ID: ${id}) ${url}`;
      }).join("\n");
      return { content: [{ type: "text", text: `Pages in space '${spaceId}':\n${summary}` }] };
    }
  );
}
