import { z } from "zod";
import { ConfluenceClient } from "../clients/confluenceClient";

export function registerPageTools(server: any, config: any) {
  server.tool(
    "get-page",
    "Get a Confluence page by ID (optionally specify content format: storage or markdown)",
    { pageId: z.string().describe("Confluence page ID"), bodyFormat: z.enum(["storage", "markdown"]).optional().describe("Content format: storage (default) or markdown") },
    async (
      { pageId, bodyFormat }: { pageId: string; bodyFormat?: "storage" | "markdown" },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const format = bodyFormat || "storage";
      const response = await client.getPage(pageId, format);
      const page = response.data;
      let content = "";
      if (format === "markdown") {
        content = page.body?.atlas_doc_format?.value || "";
      } else {
        content = page.body?.storage?.value || "";
      }
      // Return only essential fields and the full content
      return {
        id: page.id,
        title: page.title,
        url: `${config.baseUrl}/pages/${page.id}`,
        content
      };
    }
  );

  server.tool(
    "update-page",
    "Update a Confluence page by ID",
    { pageId: z.string().describe("Confluence page ID"), data: z.any().describe("Page update data") },
    async (
      { pageId, data }: { pageId: string; data: any },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.updatePage(pageId, data);
      const page = response.data;
      return {
        id: page.id,
        title: page.title,
        status: page.status || "updated"
      };
    }
  );

  server.tool(
    "get-children",
    "Get children of a Confluence page by ID",
    { pageId: z.string().describe("Confluence page ID") },
    async (
      { pageId }: { pageId: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getChildren(pageId);
      const children = (response.data.results || []).map((child: any) => ({
        id: child.id,
        title: child.title,
        url: `${config.baseUrl}/pages/${child.id}`
      }));
      return { children };
    }
  );

  server.tool(
    "create-page",
    "Create a new Confluence page",
    { spaceId: z.string().describe("Space ID"), title: z.string().describe("Page title"), body: z.string().describe("Page body (HTML or storage format)"), parentId: z.string().optional().describe("Parent page ID") },
    async (
      { spaceId, title, body, parentId }: { spaceId: string; title: string; body: string; parentId?: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.createPage(spaceId, title, body, parentId);
      const page = response.data;
      return {
        id: page.id,
        title: page.title,
        url: `${config.baseUrl}/pages/${page.id}`
      };
    }
  );

  server.tool(
    "delete-page",
    "Delete a Confluence page by ID",
    { pageId: z.string().describe("Confluence page ID") },
    async (
      { pageId }: { pageId: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      await client.deletePage(pageId);
      return { id: pageId, status: "deleted" };
    }
  );

  server.tool(
    "search-pages-by-title",
    "Search Confluence pages by title",
    { title: z.string().describe("Page title") },
    async (
      { title }: { title: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.searchPagesByTitle(title);
      const results = response.data.results || response.data.pageResults || [];
      if (!results.length) {
        return { pages: [] };
      }
      const pages = results.map((page: any) => ({
        id: page.id,
        title: page.title || "Untitled",
        url: `${config.baseUrl}/spaces/${page.space?.key || ''}/pages/${page.id}`
      }));
      return { pages };
    }
  );
}
