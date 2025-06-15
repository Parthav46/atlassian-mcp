import { z } from "zod";
import { JiraClient } from "../clients/jiraClient";

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
      const issue = response.data;
      return {
        key: issue.key,
        summary: issue.fields?.summary || "",
        status: issue.fields?.status?.name || "",
        assignee: issue.fields?.assignee?.displayName || "Unassigned",
        url: `${config.baseUrl}/browse/${issue.key}`,
        description: issue.fields?.description || undefined
      };
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
        return { issues: [] };
      }
      return {
        issues: issues.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields?.summary || "",
          status: issue.fields?.status?.name || "",
          assignee: issue.fields?.assignee?.displayName || "Unassigned",
          url: `${config.baseUrl}/browse/${issue.key}`
        }))
      };
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
      const issue = response.data;
      return {
        key: issue.key,
        url: `${config.baseUrl}/browse/${issue.key}`,
        summary: issue.fields?.summary || ""
      };
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
      const issue = response.data;
      return {
        key: issue.key,
        status: issue.fields?.status?.name || "updated"
      };
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
      await client.deleteIssue(issueKey);
      return { key: issueKey, status: "deleted" };
    }
  );
}
