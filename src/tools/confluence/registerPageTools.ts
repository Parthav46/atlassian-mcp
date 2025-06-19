import { z } from "zod";
import { ConfluenceClient } from "../../clients/confluenceClient";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export function registerPageTools(server: McpServer, config: any) {
  server.tool(
    "get-page",
    "Get a Confluence page by ID (optionally specify content format: storage or markdown)",
    { 
      pageId: z.number().describe("Confluence page ID"),
      bodyFormat: z.enum(["storage", "markdown"]).optional().describe("Content format: storage (default) or markdown")
    },
    async (
      { pageId, bodyFormat }: { pageId: number; bodyFormat?: "storage" | "markdown" },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const format = bodyFormat || "storage";
      const response = await client.getPage(pageId.toString(), format);
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
    { pageId: z.number().describe("Confluence page ID") },
    async (
      { pageId }: { pageId: number },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getChildren(pageId.toString());
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
    {
      spaceKey: z.string().describe("Space Key"),
      title: z.string().describe("Page title"),
      body: z.string().describe("Page body (HTML or storage format)"),
      parentId: z.number().optional().describe("Parent page ID")
    },
    async (
      { spaceKey, title, body, parentId }: { spaceKey: string; title: string; body: string; parentId?: number },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const spacesResponse = await client.listSpaces(undefined, 1, spaceKey);
      const spaceId = spacesResponse.data.results?.[0]?.id;
      if (!spaceId) {
        return {
          content: [
            {
              type: "text",
              text: `Space with key "${spaceKey}" not found.`
            }
          ]
        };
      }

      const response = await client.createPage(spaceId, title, body, parentId?.toString());
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
      pageId: z.number().describe("Confluence page ID"),
      title: z.string().describe("Page title"),
      body: z.string().describe("Page body (HTML or storage format)"),
      version: z.number().describe("New version number for the page"),
      status: z.string().optional().describe("Page status (default: current)")
    },
    async (
      { pageId, title, body, version, status }: { pageId: number; title: string; body: string; version: number; status?: string },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.updatePage(pageId.toString(), { title, body, version, status });
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
    { pageId: z.number().describe("Confluence page ID") },
    async (
      { pageId }: { pageId: number },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      await client.deletePage(pageId.toString());
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
