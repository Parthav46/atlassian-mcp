import { ConfluenceClient } from "../../clients/confluenceClient";
import { AtlassianConfig } from "../../clients/atlassianConfig";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp";
import type { GetPageRequest } from "../../types/confluenceClient.type";

export function registerConfluenceResources(server: McpServer, config: AtlassianConfig): void {
  // Resource for getting a Confluence page by ID
  server.resource(
    "confluence-page",
    new ResourceTemplate("confluence://page/{id}", {
      list: undefined // No general listing for individual pages
    }),
    {
      description: "Get a Confluence page by ID with content in storage format",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const client = new ConfluenceClient(config);
      const pageId = variables.id as string;
      
      if (!pageId) {
        throw new Error("Page ID is required");
      }
      
      // Parse format from query parameters, default to storage
      const searchParams = new URLSearchParams(uri.search);
      const bodyFormat = searchParams.get('format') || 'storage';
      
      const data: GetPageRequest = {
        id: pageId,
        "body-format": bodyFormat === "markdown" ? "atlas_doc_format" : "storage"
      };
      
      const response = await client.getPage(data);
      const page = response.data;
      
      const webUrl = page._links?.webui
        ? `${config.baseUrl}/wiki${page._links.webui}`
        : 'No link available';
      
      let content = "";
      if (bodyFormat === "markdown") {
        content = page.body?.atlas_doc_format?.value || "";
      } else {
        content = page.body?.storage?.value || "";
      }
      
      const result = {
        id: page.id,
        title: page.title || "Untitled",
        type: page.type,
        status: page.status,
        version: page.version,
        // Space information not available in page response directly
        webUrl,
        contentFormat: bodyFormat,
        content
      };
      
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Resource for getting children of a Confluence page
  server.resource(
    "confluence-page-children",
    new ResourceTemplate("confluence://page/{id}/children", {
      list: undefined
    }),
    {
      description: "Get children pages of a Confluence page by ID",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const client = new ConfluenceClient(config);
      const pageId = variables.id as string;
      
      if (!pageId) {
        throw new Error("Page ID is required");
      }
      
      const response = await client.getChildren(parseInt(pageId));
      const results = response.data.results || [];
      
      const children = results.map((child: { id: string; title: string; type: string; status: string; _links?: { webui?: string } }) => ({
        id: child.id,
        title: child.title,
        type: child.type,
        status: child.status,
        webUrl: child._links?.webui ? `${config.baseUrl}/wiki${child._links.webui}` : undefined
      }));
      
      const result = {
        parentPageId: pageId,
        childrenCount: children.length,
        children
      };
      
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Resource for getting a Confluence space by ID
  server.resource(
    "confluence-space",
    new ResourceTemplate("confluence://space/{id}", {
      list: undefined
    }),
    {
      description: "Get a Confluence space by ID",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const client = new ConfluenceClient(config);
      const spaceId = variables.id as string;
      
      if (!spaceId) {
        throw new Error("Space ID is required");
      }
      
      const response = await client.getSpace(parseInt(spaceId));
      const space = response.data;
      
      const webUrl = space._links?.webui
        ? `${config.baseUrl}${space._links.webui}`
        : `${config.baseUrl}/spaces/${space.key}`;
      
      const result = {
        id: space.id,
        key: space.key,
        name: space.name,
        type: space.type,
        status: space.status,
        description: space.description || "No description",
        webUrl
      };
      
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Resource for getting a Confluence folder by ID
  server.resource(
    "confluence-folder",
    new ResourceTemplate("confluence://folder/{id}", {
      list: undefined
    }),
    {
      description: "Get a Confluence folder by ID",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const client = new ConfluenceClient(config);
      const folderId = variables.id as string;
      
      if (!folderId) {
        throw new Error("Folder ID is required");
      }
      
      const response = await client.getFolder(parseInt(folderId));
      const folder = response.data;
      
      const name = folder.name || folder.title || "undefined";
      const webUrl = folder._links?.webui
        ? `${config.baseUrl}${folder._links.webui}`
        : `${config.baseUrl}/folders/${folder.id}`;
      
      const result = {
        id: folder.id,
        name,
        description: folder.description || "None",
        webUrl
      };
      
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Resource for listing all Confluence spaces
  server.resource(
    "confluence-spaces",
    "confluence://spaces",
    {
      description: "List all Confluence spaces with optional filtering",
      mimeType: "application/json"
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (uri, _extra) => {
      const client = new ConfluenceClient(config);
      
      // Parse query parameters for filtering
      const searchParams = new URLSearchParams(uri.search);
      const start = searchParams.get('start') ? parseInt(searchParams.get('start')!) : undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const keys = searchParams.get('keys') || undefined;
      
      const response = await client.listSpaces(start, limit, keys);
      const results = response.data.results || [];
      
      const spaces = results.map((space: { id: string; key: string; name: string; type: string; status: string }) => ({
        id: space.id,
        key: space.key,
        name: space.name,
        type: space.type,
        status: space.status,
        webUrl: `${config.baseUrl}/spaces/${space.key}`
      }));
      
      const result = {
        total: results.length,
        start: start || 0,
        limit: limit || 25,
        spaces
      };
      
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Resource for Confluence CQL search
  server.resource(
    "confluence-search",
    new ResourceTemplate("confluence://search/{cql}", {
      list: undefined,
      complete: {
        cql: async (value: string) => {
          // Provide some common CQL completion suggestions
          const suggestions = [
            "type = page",
            "type = blogpost",
            "space = ",
            "title ~ ",
            "text ~ ",
            "creator = currentUser()",
            "created >= now('-1w')"
          ];
          return suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));
        }
      }
    }),
    {
      description: "Advanced Confluence search using CQL (Confluence Query Language)",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const client = new ConfluenceClient(config);
      const cql = variables.cql as string;
      
      if (!cql) {
        throw new Error("CQL query is required");
      }
      
      // Parse additional query parameters
      const searchParams = new URLSearchParams(uri.search);
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const start = searchParams.get('start') ? parseInt(searchParams.get('start')!) : undefined;
      
      const response = await client.searchWithCql(cql, limit, start);
      const results = response.data.results || [];
      
      const searchResults = results.map((item: { id: string; title: string; type: string; status: string; _links?: { webui?: string }; excerpt?: string }) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        webUrl: item._links?.webui ? `${config.baseUrl}/wiki${item._links.webui}` : undefined,
        excerpt: item.excerpt || ""
      }));
      
      const result = {
        searchQuery: cql,
        total: results.length,
        start: 0,
        limit: limit || 25,
        results: searchResults
      };
      
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );
}