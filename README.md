# Atlassian MCP Confluence Server

This project implements a Model Context Protocol (MCP) server for interacting with Atlassian Confluence and Jira via LLMs. It is designed for extensibility and supports multi-project Confluence access via request headers.

## Features
- Get, update, and explore Confluence pages, folders, children, and spaces
- Perform advanced searches using CQL (Confluence Query Language)
- Interact with Jira issues (create, update, delete, search)
- Designed for LLM integration (e.g., Claude for Desktop)
- Multi-project support via headers

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Configure environment:**
   - Set optional defaults using node command arguments:
     ```
     --base-url=<Confluence or Jira base URL>
     --user-token=<User token>
     --username=<Username>
     ```
   - These arguments are passed when starting the server and override any environment variables.

3. **Build the project:**
   ```sh
   npm run build
   ```

4. **Run the server:**
   ```sh
   npm start
   ```

## Code Structure

The project is modularized for better maintainability:
- **src/registerTools.ts**: Delegates tool registration to modular files.
- **src/registerJiraTools.ts**: Handles Jira-related tools.
- **src/registerPageTools.ts**: Handles Confluence page-related tools.
- **src/registerSpaceTools.ts**: Handles Confluence space-related tools.
- **src/registerCqlTools.ts**: Handles advanced CQL search tools.

## Usage with Claude for Desktop
- Add this server as an MCP server in your Claude for Desktop config.
- The server communicates over stdio and exposes tools for Confluence and Jira operations.

## Scripts
- `npm run build` — Compile TypeScript
- `npm start` — Run the server using compiled JS
- `npm run dev` — Run the server with ts-node (for development)

---

MIT License
