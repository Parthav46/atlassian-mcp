import { registerJiraTools } from "./tools/jira/registerJiraTools";
import { registerPageTools } from "./tools/confluence/registerPageTools";
import { registerSpaceTools } from "./tools/confluence/registerSpaceTools";
import { registerCqlTools } from "./tools/confluence/registerCqlTools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { AtlassianConfig } from "./clients/atlassianConfig";

function getAtlassianConfig(): AtlassianConfig {
  // Use --base-url, --token, --username for both
  let baseUrl = '';
  let token = '';
  let username = '';
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--base-url' && process.argv[i + 1]) {
      baseUrl = process.argv[i + 1];
    }
    if (process.argv[i] === '--token' && process.argv[i + 1]) {
      token = process.argv[i + 1];
    }
    if (process.argv[i] === '--username' && process.argv[i + 1]) {
      username = process.argv[i + 1];
    }
  }
  if (!baseUrl) baseUrl = process.env.ATLASSIAN_BASE_URL || '';
  if (!token) token = process.env.ATLASSIAN_API_TOKEN || '';
  if (!username) username = process.env.ATLASSIAN_USERNAME || '';
  return Object.freeze({ baseUrl, token, username });
}

export function registerTools(server: McpServer): void {
  const config = getAtlassianConfig();
  registerPageTools(server, config);
  registerSpaceTools(server, config);
  registerCqlTools(server, config);
  registerJiraTools(server, config);
}
