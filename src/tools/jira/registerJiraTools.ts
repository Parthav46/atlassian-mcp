import { z } from "zod";
import { JiraClient } from "../../clients/jiraClient";
import { AtlassianConfig } from "../../clients/atlassianConfig";
import { parseJiraDescription, parseJiraSubtasks } from './jiraUtils';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { JiraIssueRequest, JqlSearchParams } from "../../types/jiraClient.type";

// ADF validation schemas  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADFMarkSchema = z.object({
  type: z.string(),
  attrs: z.record(z.unknown()).optional()
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADFNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.string(),
  attrs: z.record(z.unknown()).optional(),
  content: z.array(ADFNodeSchema).optional(),
  marks: z.array(ADFMarkSchema).optional(),
  text: z.string().optional()
}));

const ADFDocumentSchema = z.object({
  version: z.literal(1),
  type: z.literal('doc'),
  content: z.array(ADFNodeSchema)
});

// Legacy ADF schema for backward compatibility
const LegacyADFSchema = z.object({
  type: z.string().describe("Content type (e.g., 'doc')"),
  content: z.array(z.any()).optional().describe("ADF content array"),
  version: z.number().optional().describe("ADF version")
});

// Union schema that accepts both new and legacy formats
const DescriptionSchema = z.union([
  ADFDocumentSchema.describe("ADF document with full type safety"),
  LegacyADFSchema.describe("Legacy ADF format for backward compatibility")
]).optional().describe("Issue description in ADF format");

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
      data: JqlSearchParams
    ) => {
      const client = new JiraClient(config);

      if (!data.fields || data.fields.length === 0) {
        data.fields = ["summary", "status", "assignee", "description"];
      }

      const response = await client.searchIssues(data);
      const issues = response.data.issues || [];
      if (!issues.length) {
        return {
          content: [
            {
              type: "text",
              text: "No issues found for the given JQL query."
            }
          ]
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Search Result:
            Size:${issues.length}
            IsLastPage:${response.data.isLast}
            NextPageToken:${response.data.nextPageToken || "N/A"}
            Issues:
            ${JSON.stringify(issues, null, 2)}`
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
      { issueKey }: { issueKey: string }
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
            id: z.string().describe("Project ID")
          }),
          parent: z.object({
            key: z.string().describe("Parent issue key")
          }).optional(),
          summary: z.string().describe("Issue summary"),
          description: DescriptionSchema,
          issuetype: z.object({
            id: z.string().describe("Issue type ID")
          }),
        }).passthrough().describe("Issue fields - additional fields can be passed"),
        update: z.object({}).optional().describe("Update operations"),
      }).passthrough().describe("Jira issue data (JSON)")
    },
    async (
      { issueData }: { issueData: JiraIssueRequest }
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
      issueData: z.object({
        fields: z.object({
          project: z.object({
            id: z.string().describe("Project ID")
          }),
          parent: z.object({
            key: z.string().describe("Parent issue key")
          }).optional(),
          summary: z.string().describe("Issue summary"),
          description: DescriptionSchema,
          issuetype: z.object({
            id: z.string().describe("Issue type ID")
          }),
        }).passthrough().describe("Issue fields - additional fields can be passed"),
        update: z.object({}).optional().describe("Update operations"),
      }).passthrough().describe("Jira issue data (JSON)")
    },
    async (
      { issueKey, issueData }: { issueKey: string; issueData: JiraIssueRequest }
    ) => {
      const client = new JiraClient(config);
      
      await client.updateIssue(issueKey, issueData);
      return {
        content: [
          {
            type: "text",
            text: `Updated issue: ${issueKey}`
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
      { issueKey }: { issueKey: string }
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
