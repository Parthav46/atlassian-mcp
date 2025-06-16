import { z } from "zod";
import { JiraClient } from "../clients/jiraClient";

function parseJiraDescription(description: any): string {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (description.type === 'doc' && Array.isArray(description.content)) {
    const parseContent = (contentArr: any[]): string => {
      return contentArr.map(block => {
        if (block.type === 'paragraph' && Array.isArray(block.content)) {
          return block.content.map((c: any) => c.text || '').join('');
        }
        if (block.type === 'orderedList' && Array.isArray(block.content)) {
          return block.content.map((item: any, idx: number) => {
            // Each item is a listItem with content
            const text = item.content ? parseContent(item.content) : '';
            return `${idx + 1}. ${text}`;
          }).join('\n');
        }
        if (block.type === 'listItem' && Array.isArray(block.content)) {
          return block.content.map((c: any) => parseContent([c])).join('');
        }
        return '';
      }).join('\n');
    };
    return parseContent(description.content);
  }
  return '';
}

function parseJiraSubtasks(subtasks: any[]): string {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return '';
  return subtasks.map(sub => {
    const summary = sub.fields?.summary || '';
    const status = sub.fields?.status?.name || '';
    const key = sub.key;
    return `- [${key}] ${summary} (${status})`;
  }).join('\n');
}

export function registerJiraTools(server: any, config: any) {
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
    "Get a Jira issue by key",
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
