import { z } from "zod";
import { ConfluenceClient } from "../clients/confluenceClient";

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
      const folder = response.data;
      return {
        id: folder.id,
        name: folder.name,
        url: `${config.baseUrl}/folders/${folder.id}`,
        description: folder.description || undefined
      };
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
      const space = response.data;
      return {
        id: space.id,
        key: space.key,
        name: space.name,
        url: `${config.baseUrl}/spaces/${space.key}`,
        description: space.description?.plain?.value || undefined
      };
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
      const results = response.data.results || [];
      const spaces = results.map((space: any) => ({
        id: space.id,
        key: space.key,
        name: space.name,
        url: `${config.baseUrl}/spaces/${space.key}`
      }));
      return { spaces };
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
        return { pages: [] };
      }
      const pages = results.map((page: any) => ({
        id: page.id,
        title: page.title || "Untitled",
        url: `${config.baseUrl}/spaces/${spaceId}/pages/${page.id}`
      }));
      return { pages };
    }
  );
}
