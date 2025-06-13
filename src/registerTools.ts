import { z } from "zod";
import { ConfluenceClient } from "./confluenceClient";
import { JiraClient } from "./jiraClient";

// Helper to get config from extra.request.headers
function getAtlassianConfig(_extra: any) {
  // Use --base-url, --user-token, --username for both
  let baseUrl = '';
  let userToken = '';
  let username = '';
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--base-url' && process.argv[i + 1]) {
      baseUrl = process.argv[i + 1];
    }
    if (process.argv[i] === '--user-token' && process.argv[i + 1]) {
      userToken = process.argv[i + 1];
    }
    if (process.argv[i] === '--username' && process.argv[i + 1]) {
      username = process.argv[i + 1];
    }
  }
  if (!baseUrl) baseUrl = process.env.BASE_URL || '';
  if (!userToken) userToken = process.env.USER_TOKEN || '';
  if (!username) username = process.env.USERNAME || '';
  return { baseUrl, userToken, username };
}

export function registerTools(server: any) {
  // Confluence tools
  server.tool(
    "get-page",
    "Get a Confluence page by ID (optionally specify content format: storage or markdown)",
    { pageId: z.string().describe("Confluence page ID"), bodyFormat: z.enum(["storage", "markdown"]).optional().describe("Content format: storage (default) or markdown") },
    async (
      { pageId, bodyFormat }: { pageId: string; bodyFormat?: "storage" | "markdown" },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new ConfluenceClient(config);
      const response = await client.getChildren(pageId);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "get-folder",
    "Get a Confluence folder by ID",
    { folderId: z.string().describe("Confluence folder ID") },
    async (
      { folderId }: { folderId: string },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new ConfluenceClient(config);
      const response = await client.listSpaces(start, limit);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "create-page",
    "Create a new Confluence page",
    { spaceId: z.string().describe("Space ID"), title: z.string().describe("Page title"), body: z.string().describe("Page body (HTML or storage format)"), parentId: z.string().optional().describe("Parent page ID") },
    async (
      { spaceId, title, body, parentId }: { spaceId: string; title: string; body: string; parentId?: string },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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

  server.tool(
    "get-pages-from-space",
    "Get pages from a Confluence space (v2 API)",
    { spaceId: z.string().describe("Confluence space ID"), limit: z.number().optional().describe("Page size limit"), cursor: z.string().optional().describe("Pagination cursor") },
    async (
      { spaceId, limit, cursor }: { spaceId: string; limit?: number; cursor?: string },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
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

  server.tool(
    "confluence_search",
    "Advanced Confluence search using CQL (Confluence Query Language)",
    { cql: z.string().describe("CQL query string"), limit: z.number().optional(), start: z.number().optional() },
    async (
      { cql, limit, start }: { cql: string; limit?: number; start?: number },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new ConfluenceClient(config);
      const response = await client.searchWithCql(cql, limit, start);
      const results = response.data.results || [];
      if (!results.length) {
        return { content: [{ type: "text", text: "No pages found for this CQL query." }] };
      }
      const summary = results.map((page: any) => {
        const id = page.id;
        const pageTitle = page.title || "Untitled";
        const url = `${config.baseUrl}/spaces/${page.space?.key || ''}/pages/${id}`;
        return `- [${pageTitle}] (ID: ${id}) ${url}`;
      }).join("\n");
      return { content: [{ type: "text", text: `Confluence search results:\n${summary}` }] };
    }
  );

  // Jira tools
  server.tool(
    "get-jira-issue",
    "Get a Jira issue by key",
    { issueKey: z.string().describe("Jira issue key") },
    async (
      { issueKey }: { issueKey: string },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new JiraClient(config);
      const response = await client.getIssue(issueKey);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "search-jira-issues",
    "Search Jira issues using JQL",
    { jql: z.string().describe("Jira Query Language (JQL) string"), startAt: z.number().optional(), maxResults: z.number().optional() },
    async (
      { jql, startAt, maxResults }: { jql: string; startAt?: number; maxResults?: number },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new JiraClient(config);
      const response = await client.searchIssues(jql, startAt, maxResults);
      // Summarize issues for LLM
      const issues = response.data.issues || [];
      if (issues.length === 0) {
        return { content: [{ type: "text", text: "No issues found." }] };
      }
      const summary = issues.map((issue: any) => {
        const key = issue.key;
        const summary = issue.fields?.summary || "";
        const status = issue.fields?.status?.name || "";
        const assignee = issue.fields?.assignee?.displayName || "Unassigned";
        return `- [${key}] ${summary} (Status: ${status}, Assignee: ${assignee})`;
      }).join("\n");
      return { content: [{ type: "text", text: `Jira issues found:\n${summary}` }] };
    }
  );

  server.tool(
    "create-jira-issue",
    "Create a new Jira issue",
    { issueData: z.any().describe("Jira issue data (JSON)") },
    async (
      { issueData }: { issueData: any },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new JiraClient(config);
      const response = await client.createIssue(issueData);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "update-jira-issue",
    "Update a Jira issue by key",
    { issueKey: z.string().describe("Jira issue key"), issueData: z.any().describe("Jira issue update data (JSON)") },
    async (
      { issueKey, issueData }: { issueKey: string; issueData: any },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new JiraClient(config);
      const response = await client.updateIssue(issueKey, issueData);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );

  server.tool(
    "delete-jira-issue",
    "Delete a Jira issue by key",
    { issueKey: z.string().describe("Jira issue key") },
    async (
      { issueKey }: { issueKey: string },
      extra: any
    ) => {
      const config = getAtlassianConfig(extra);
      const client = new JiraClient(config);
      const response = await client.deleteIssue(issueKey);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );
}
