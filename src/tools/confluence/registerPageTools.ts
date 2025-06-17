import { z } from "zod";
import { ConfluenceClient } from "../../clients/confluenceClient";

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
      let url = page._links?.webui
        ? `${config.baseUrl}/wiki${page._links.webui}`
        : 'No link available';
      let content = "";
      if (format === "markdown") {
        content = page.body?.atlas_doc_format?.value || "";
      } else {
        content = page.body?.storage?.value || "";
      }
      return {
        content: [
          {
            type: "text",
            text: `Title: ${page.title || "Untitled"}\nURL: ${url}\n\n${content}`
          }
        ]
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
      const children = (response.data.results || []).map((child: any) => {
        let url = `${config.baseUrl}/wiki/spaces/${child.spaceId}/pages/${child.id}`;
        return `- ${child.title || "Untitled"}: ${url}`;
      });
      return {
        content: [
          {
            type: "text",
            text: children.length
              ? `Children:\n${children.join("\n")}`
              : "No children found."
          }
        ]
      };
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
      if (response.status !== 200 && response.status !== 201) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create page: ${response.status} ${response.statusText}`
            }
          ]
        };
      }

      const page = response.data;
      const pageUrl = page._links && page._links.webui ? `${config.baseUrl}/wiki${page._links.webui}` : 'No link available';
      return {
        content: [
          {
            type: "text",
            text: `Created page: ${page.title || "Untitled"} (${pageUrl})`
          }
        ]
      };
    }
  );

  server.tool(
    "update-page",
    "Update a Confluence page by ID",
    { 
      pageId: z.string().describe("Confluence page ID"),
      title: z.string().describe("Page title"),
      body: z.string().describe("Page body (HTML or storage format)"),
      version: z.number().describe("New version number for the page"),
      status: z.string().optional().describe("Page status (default: current)")
    },
    async (
      { pageId, title, body, version, status }: { pageId: string; title: string; body: string; version: number; status?: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.updatePage(pageId, { title, body, version, status });
      const page = response.data;
      return {
        content: [
          {
            type: "text",
            text: `Updated page: ${page.title || "Untitled"} (ID: ${page.id}) Status: ${page.status || "updated"}`
          }
        ]
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
      return {
        content: [
          {
            type: "text",
            text: `Deleted page: ${pageId}`
          }
        ]
      };
    }
  );
}
