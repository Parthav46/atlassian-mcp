import { z } from "zod";
import { JiraClient } from "../../clients/jiraClient";
import { AtlassianConfig } from "../../clients/atlassianConfig";
import { parseJiraDescription, parseJiraSubtasks } from './jiraUtils';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export function registerJiraTools(server: McpServer, config: AtlassianConfig): void {
  server.tool(
    "search-jira-issues",
    "Search Jira issues using JQL",
    {
      jql: z.string().describe("Jira Query Language (JQL) string. A bounded query is required."),
      nextPageToken: z.string().optional().describe("The token for fetching the next page of results. Use the nextPageToken from the previous response for pagination."),
      maxResults: z.number().optional().describe("The maximum number of items to return per page. Default is 50. Maximum is 5000."),
      fields: z.array(z.string()).optional().describe("A list of fields to return for each issue. Accepts a comma-separated list. Example: ['summary','comment']"),
      expand: z.string().optional().describe("Comma-delimited string to include additional information about issues in the response. Example: 'names,changelog'."),
      properties: z.array(z.string()).optional().describe("A list of up to 5 issue properties to include in the results. Accepts a comma-separated list."),
      fieldsByKeys: z.boolean().optional().describe("Reference fields by their key (true) or ID (false). Default is false."),
      failFast: z.boolean().optional().describe("Fail this request early if all field data cannot be retrieved. Default is false."),
      reconcileIssues: z.array(z.number()).optional().describe("Strong consistency issue IDs to be reconciled with search results. Accepts up to 50 IDs.")
    },
    async (
      {
        jql,
        nextPageToken,
        maxResults,
        fields,
        expand,
        properties,
        fieldsByKeys,
        failFast,
        reconcileIssues
      }: {
        jql: string;
        nextPageToken?: string;
        maxResults?: number;
        fields?: string[];
        expand?: string;
        properties?: string[];
        fieldsByKeys?: boolean;
        failFast?: boolean;
        reconcileIssues?: number[];
      },
      _extra: any
    ) => {
      const client = new JiraClient(config);
      const response = await client.searchIssues({
        jql,
        nextPageToken,
        maxResults,
        fields,
        expand,
        properties,
        fieldsByKeys,
        failFast,
        reconcileIssues
      });
      const issues = response.data.issues || [];
      if (issues.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No issues found."
            }
          ]
        };
      }
      return {
        content: [
          {
            type: "text",
            text:
              issues
                .map((issue: any) =>
                  `Key: ${issue.key}\nSummary: ${issue.fields?.summary || ""}\nStatus: ${issue.fields?.status?.name || ""}\nAssignee: ${issue.fields?.assignee?.displayName || "Unassigned"}\nURL: ${config.baseUrl}/browse/${issue.key}\n`
                )
                .join("\n---\n")
          }
        ]
      };
    }
  );

  server.tool(
    "get-jira-issue",
    "Get a Jira issue by key. Returns issue details including description and subtasks.",
    { issueKey: z.string().describe("Jira issue key") },
    async (
      { issueKey }: { issueKey: string },
      _extra: any
    ) => {
      const client = new JiraClient(config);
      const response = await client.getIssue(issueKey);
      const issue = response.data;
      const description = parseJiraDescription(issue.fields?.description);
      const subtasks = parseJiraSubtasks(issue.fields?.subtasks);
      return {
        content: [
          {
            type: 'text',
            text:
              `Key: ${issue.key}\n` +
              `Summary: ${issue.fields?.summary || ""}\n` +
              `Status: ${issue.fields?.status?.name || ""}\n` +
              `Assignee: ${issue.fields?.assignee?.displayName || "Unassigned"}\n` +
              `URL: ${config.baseUrl}/browse/${issue.key}\n` +
              (description ? `Description:\n${description}\n` : "") +
              (subtasks ? `Subtasks:\n${subtasks}` : "")
          }
        ]
      };
    }
  );

  server.tool(
    "create-jira-issue",
    "(WIP) Create a new Jira issue. This tool is a work in progress and may not be fully functional yet.",
    {
      issueData: z.object({
        fields: z.object({
          project: z.object({
            key: z.string().describe("Project key")
          }),
          summary: z.string().describe("Issue summary"),
          issuetype: z.object({
            id: z.string().optional().describe("Issue type ID"),
            name: z.string().optional().describe("Issue type name")
          }),
          description: z.string().optional().describe("Issue description"),
          assignee: z.object({
            id: z.string().optional(),
            name: z.string().optional()
          }).optional(),
        })
      }).describe("Jira issue data (JSON)")
    },
    async (
      { issueData }: { issueData: { fields: any } },
      _extra: any
    ) => {
      const client = new JiraClient(config);
      const response = await client.createIssue(issueData);
      const issue = response.data;
      return {
        content: [
          {
            type: "text",
            text:
              `Created issue: ${issue.key}\n` +
              `Summary: ${issue.fields?.summary || ""}\n` +
              `URL: ${config.baseUrl}/browse/${issue.key}`
          }
        ]
      };
    }
  );

  server.tool(
    "update-jira-issue",
    "(WIP) Update a Jira issue by key. This tool is a work in progress and may not be fully functional yet.",
    { 
      issueKey: z.string().describe("Jira issue key"), 
      issueData: z.any().describe("Jira issue update data (JSON)") 
    },
    async (
      { issueKey, issueData }: { issueKey: string; issueData?: any },
      _extra: any
    ) => {
      const client = new JiraClient(config);
      const response = await client.updateIssue(issueKey, issueData);
      const issue = response.data;
      return {
        content: [
          {
            type: "text",
            text:
              `Updated issue: ${issue.key}\n` +
              `Status: ${issue.fields?.status?.name || "updated"}`
          }
        ]
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
      return {
        content: [
          {
            type: "text",
            text: `Deleted issue: ${issueKey}`
          }
        ]
      };
    }
  );
}
