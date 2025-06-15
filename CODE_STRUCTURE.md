# Project Code Structure

The project is modularized for maintainability and clarity:
- **src/index.ts**: Entry point for the MCP server (stdio transport).
- **src/registerTools.ts**: Loads configuration and registers all tool modules with the server.
- **src/clients/confluenceClient.ts**: Confluence API client (handles authentication and requests).
- **src/clients/jiraClient.ts**: Jira API client (handles authentication and requests).
- **src/tools/registerPageTools.ts**: Registers Confluence page-related tools (get, update, create, delete, search pages).
- **src/tools/registerSpaceTools.ts**: Registers Confluence space and folder tools (get space, list spaces, get folder, get pages from space).
- **src/tools/registerCqlTools.ts**: Registers advanced CQL search tools for Confluence.
- **src/tools/registerJiraTools.ts**: Registers Jira issue tools (get, search, create, update, delete issues).
- **config/confluence.ts**: Utility for extracting Confluence config from headers or environment.
