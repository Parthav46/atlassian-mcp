import { JiraClient } from "../../clients/jiraClient";
import { AtlassianConfig } from "../../clients/atlassianConfig";
import { parseJiraDescription, parseJiraSubtasks } from '../../tools/jira/jiraUtils';
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp";
import type { JqlSearchParams } from "../../types/jiraClient.type";

export function registerJiraResources(server: McpServer, config: AtlassianConfig): void {
  // Resource for getting a single Jira issue by key
  server.resource(
    "jira-issue",
    new ResourceTemplate("jira://issue/{key}", {
      list: undefined // No listing capability for individual issues
    }),
    {
      description: "Get a Jira issue by key. Returns issue details including description and subtasks.",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const client = new JiraClient(config);
      const issueKey = variables.key as string;
      
      if (!issueKey) {
        throw new Error("Issue key is required");
      }
      
      const response = await client.getIssue(issueKey);
      const issue = response.data;
      
      // Parse description and subtasks similar to the original tool
      const parsedDescription = parseJiraDescription(issue.fields?.description);
      const parsedSubtasks = parseJiraSubtasks(issue.fields?.subtasks);
      
      const result = {
        key: issue.key,
        summary: issue.fields?.summary,
        status: issue.fields?.status?.name,
        assignee: issue.fields?.assignee?.displayName || "Unassigned",
        reporter: issue.fields?.reporter?.displayName,
        project: issue.fields?.project?.name,
        issueType: issue.fields?.issuetype?.name,
        priority: issue.fields?.priority?.name,
        created: issue.fields?.created,
        updated: issue.fields?.updated,
        description: parsedDescription,
        subtasks: parsedSubtasks,
        webUrl: `${config.baseUrl}/browse/${issue.key}`
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

  // Resource for searching Jira issues with JQL
  server.resource(
    "jira-search",
    new ResourceTemplate("jira://search/{jql}", {
      list: undefined, // JQL search doesn't have a general listing
      complete: {
        jql: async (value: string) => {
          // Provide some common JQL completion suggestions
          const suggestions = [
            "project = ",
            "assignee = currentUser()",
            "status = ",
            "priority = ",
            "created >= -1w",
            "updated >= -1d"
          ];
          return suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));
        }
      }
    }),
    {
      description: "Search Jira issues using JQL (Jira Query Language)",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const client = new JiraClient(config);
      const jql = variables.jql as string;
      
      if (!jql) {
        throw new Error("JQL query is required");
      }
      
      // Parse additional query parameters from the URI
      const searchParams = new URLSearchParams(uri.search);
      const maxResults = searchParams.get('maxResults') ? parseInt(searchParams.get('maxResults')!) : 50;
      const fields = searchParams.get('fields') ? searchParams.get('fields')!.split(',') : ["summary", "status", "assignee", "description"];
      
      const data: JqlSearchParams = {
        jql,
        maxResults,
        fields,
        nextPageToken: searchParams.get('nextPageToken') || undefined,
        expand: searchParams.get('expand') || undefined
      };
      
      const response = await client.searchIssues(data);
      const issues = response.data.issues || [];
      
      const result = {
        searchQuery: jql,
        total: issues.length,
        maxResults: maxResults,
        startAt: 0,
        isLast: response.data.isLast,
        nextPageToken: response.data.nextPageToken || "N/A",
        issues: issues.map(issue => ({
          key: issue.key,
          fields: issue.fields
        }))
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