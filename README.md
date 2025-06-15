# Atlassian MCP Confluence Server

This project implements a Model Context Protocol (MCP) server for interacting with Atlassian Confluence and Jira via LLMs. It is designed for extensibility and supports multi-project Confluence access via request headers.

## Features
- Get, update, and explore Confluence pages, folders, children, and spaces
- Perform advanced searches using CQL (Confluence Query Language)
- Interact with Jira issues (create, update, delete, search)
- Designed for LLM integration (e.g., Claude for Desktop)
- Multi-project support via headers

## Local Setup

Follow these steps to set up the MCP server locally:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Steps
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd atlassian-mcp
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment:**
   - You can set configuration options using command-line arguments or environment variables:
     - `--base-url=<Confluence or Jira base URL>`
     - `--user-token=<User token>`
     - `--username=<Username>`
   - These arguments override environment variables if both are set.
4. **Build the project:**
   ```sh
   npm run build
   ```
5. **Create MCP JSON config for Copilot:**
   - Create a file named `mcp.json` in your project root with the following content:
     ```json
     {
       "command": "npx",
       "type": "stdio",
       "args": [
         "node",
         "<Absolute path to Directory>/dist/index.js",
         "--base-url=<Confluence or Jira base URL>",
         "--user-token=<User token>",
         "--username=<Username>"
       ]
     }
     ```
   - Replace the placeholders with your actual configuration values.

## Code Structure

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

## Usage with Claude for Desktop
- Add this server as an MCP server in your Claude for Desktop config.
- The server communicates over stdio and exposes tools for Confluence and Jira operations.

## Scripts
- `npm run build` — Compile TypeScript
- `npm start` — Run the server using compiled JS
- `npm run dev` — Run the server with ts-node (for development)

---

MIT License
