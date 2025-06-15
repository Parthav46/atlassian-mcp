import { z } from "zod";
import { JiraClient } from "./jiraClient.js";

export function registerJiraTools(server: any, config: any) {
  server.tool(
    "get-jira-issue",
    "Get a Jira issue by key",
    { issueKey: z.string().describe("Jira issue key") },
    async (
      { issueKey }: { issueKey: string },
      _extra: any
    ) => {
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
      _extra: any
    ) => {
      const client = new JiraClient(config);
      const response = await client.searchIssues(jql, startAt, maxResults);
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
      _extra: any
    ) => {
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
      _extra: any
    ) => {
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
      _extra: any
    ) => {
      const client = new JiraClient(config);
      const response = await client.deleteIssue(issueKey);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }
  );
}
