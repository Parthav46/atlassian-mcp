# Atlassian MCP Confluence Server

This project implements a Model Context Protocol (MCP) server for interacting with Atlassian Confluence via LLMs. It is designed for extensibility (e.g., Jira integration) and supports multi-project Confluence access via request headers.

## Features
- Get, update, and explore Confluence pages, folders, children, and spaces
- Designed for LLM integration (e.g., Claude for Desktop)
- Multi-project support via headers
- Ready for future Jira extension

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Configure environment:**
   - Copy `.env` and set optional defaults:
     ```
     CONFLUENCE_BASE_URL=
     CONFLUENCE_USER_TOKEN=
     ```
   - These can be overridden per request using headers:
     - `X-Confluence-Base-Url`: Confluence instance base URL
     - `Authorization: Bearer <token>` or `X-Confluence-Token`

3. **Build the project:**
   ```sh
   npm run build
   ```

4. **Run the server:**
   ```sh
   npm start
   ```

## Usage with Claude for Desktop
- Add this server as an MCP server in your Claude for Desktop config.
- The server communicates over stdio and exposes tools for Confluence operations.

## Extending for Jira
- Add new tools in `src/index.ts` and a Jira client in `src/`.

## Scripts
- `npm run build` — Compile TypeScript
- `npm start` — Run the server using compiled JS
- `npm run dev` — Run the server with ts-node (for development)

---

MIT License
