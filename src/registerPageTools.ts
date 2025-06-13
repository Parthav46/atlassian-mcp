import { z } from "zod";
import { ConfluenceClient } from "./confluenceClient.js";

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
        content = page.body?.atlas_doc_format?.value || "No markdown content found.";
      } else {
        content = page.body?.storage?.value || "No storage content found.";
      }
      return {
        content: [
          { type: "text", text: `Title: ${page.title}\nPage ID: ${page.id}\nFormat: ${format}\n---\n${content}` }
        ]
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
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
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
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
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
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
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
      const response = await client.deletePage(pageId);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
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
        return { content: [{ type: "text", text: "No pages found." }] };
      }
      const summary = results.map((page: any) => {
        const id = page.id;
        const pageTitle = page.title || "Untitled";
        const url = `${config.baseUrl}/spaces/${page.space?.key || ''}/pages/${id}`;
        return `- [${pageTitle}] (ID: ${id}) ${url}`;
      }).join("\n");
      return { content: [{ type: "text", text: `Confluence pages found:\n${summary}` }] };
    }
  );
}
