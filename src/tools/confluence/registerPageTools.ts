import { z } from "zod";
import { ConfluenceClient } from "../../clients/confluenceClient";
import { AtlassianConfig } from "../../clients/atlassianConfig";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { GetPageRequest, UpdatePageRequest } from "../../clients/confluenceClient.type";

export function registerPageTools(server: McpServer, config: AtlassianConfig): void {
  server.tool(
    "get-page",
    "Get a Confluence page by ID (optionally specify content format: storage or markdown)",
    { 
      pageId: z.number().describe("Confluence page ID"),
      bodyFormat: z.enum(["storage", "markdown"]).optional().describe("Content format: storage (default) or markdown")
    },
    async (
      { pageId, bodyFormat }: { pageId: number; bodyFormat?: "storage" | "markdown" }
    ) => {
      const client = new ConfluenceClient(config);
      const format = bodyFormat || "storage";
      const data: GetPageRequest = {
        id: pageId.toString(),
        "body-format": format === "markdown" ? "atlas_doc_format" : "storage"
      }
      const response = await client.getPage(data);
      const page = response.data;
      const url = page._links?.webui
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
      { pageId }: { pageId: number }
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.getChildren(pageId);
      const children = (response.data.results || []).map((child: unknown) => {
        // Type assertion for expected child structure
        const c = child as { title?: string; spaceId?: string; id?: string };
        const url = `${config.baseUrl}/wiki/spaces/${c.spaceId}/pages/${c.id}`;
        return `- ${c.title || "Untitled"}: ${url}`;
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
      { spaceKey, title, body, parentId }: { spaceKey: string; title: string; body: string; parentId?: number }
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

      const response = await client.createPage({
        spaceId: spaceId.toString(),
        title,
        body: {
          representation: "storage",
          value: body
        },
        parentId: parentId ? parentId.toString() : undefined
      });
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
      { pageId, title, body, version, status }: { pageId: number; title: string; body: string; version: number; status?: string }
    ) => {
      const client = new ConfluenceClient(config);
      const data: UpdatePageRequest = {
        id: pageId.toString(),
        title,
        body: {
          representation: "storage",
          value: body
        },
        version: {
          number: version
        },
        status: status === "draft" ? "draft" : "current"
      };
      const response = await client.updatePage(pageId, data);
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
      { pageId }: { pageId: number }
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
