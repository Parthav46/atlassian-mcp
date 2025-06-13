import { z } from "zod";
import { ConfluenceClient } from "./confluenceClient";
import { JiraClient } from "./jiraClient";

// Helper to get config from extra.request.headers
function getConfigFromExtra(extra: any) {
  const headers = (extra?.request?.headers || {}) as Record<string, string>;
  const baseUrl = headers['x-confluence-base-url'] || process.env.CONFLUENCE_BASE_URL || '';
  let userToken = '';
  const authHeader = headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userToken = authHeader.replace('Bearer ', '').trim();
  } else if (headers['x-confluence-token']) {
    userToken = headers['x-confluence-token'];
  } else if (process.env.CONFLUENCE_USER_TOKEN) {
    userToken = process.env.CONFLUENCE_USER_TOKEN;
  }
  return { baseUrl, userToken };
}

function getJiraConfigFromExtra(extra: any) {
  const headers = (extra?.request?.headers || {}) as Record<string, string>;
  const baseUrl = headers['x-jira-base-url'] || process.env.JIRA_BASE_URL || '';
  let userToken = '';
  const authHeader = headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userToken = authHeader.replace('Bearer ', '').trim();
  } else if (headers['x-jira-token']) {
    userToken = headers['x-jira-token'];
  } else if (process.env.JIRA_USER_TOKEN) {
    userToken = process.env.JIRA_USER_TOKEN;
  }
  return { baseUrl, userToken };
}

export function registerTools(server: any) {
  // Confluence tools
  server.tool(
    "get-page",
    "Get a Confluence page by ID",
    { pageId: z.string().describe("Confluence page ID") },
    async (
      { pageId }: { pageId: string },
      extra: any
    ) => {
      const config = getConfigFromExtra(extra);
      const client = new ConfluenceClient(config);
      const response = await client.getPage(pageId);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
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
      const config = getConfigFromExtra(extra);
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
      const config = getConfigFromExtra(extra);
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
      const config = getConfigFromExtra(extra);
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
      const config = getConfigFromExtra(extra);
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
      const config = getConfigFromExtra(extra);
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
      const config = getConfigFromExtra(extra);
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
      const config = getConfigFromExtra(extra);
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
      const config = getConfigFromExtra(extra);
      const client = new ConfluenceClient(config);
      const response = await client.searchPagesByTitle(title);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
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
      const config = getJiraConfigFromExtra(extra);
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
      const config = getJiraConfigFromExtra(extra);
      const client = new JiraClient(config);
      const response = await client.searchIssues(jql, startAt, maxResults);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
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
      const config = getJiraConfigFromExtra(extra);
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
      const config = getJiraConfigFromExtra(extra);
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
      const config = getJiraConfigFromExtra(extra);
      const client = new JiraClient(config);
      const response = await client.deleteIssue(issueKey);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );
}
