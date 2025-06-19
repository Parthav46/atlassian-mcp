# Atlassian MCP Server

[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![npm version](https://img.shields.io/npm/v/atlassian-mcp.svg?style=flat)](https://www.npmjs.com/package/atlassian-mcp)
[![CI](https://github.com/Parthav46/atlassian-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Parthav46/atlassian-mcp/actions/workflows/ci.yml)

This project implements a Model Context Protocol (MCP) server for interacting with Atlassian Confluence and Jira via LLMs.

## Features
- Get, update, and explore Confluence pages, folders, children, and spaces
- Perform advanced searches using CQL (Confluence Query Language)
- Interact with Jira issues (~~create, update,~~ delete, search)
- Designed for LLM integration (e.g., Claude for Desktop)

## Local Setup

Follow these steps to set up the MCP server locally:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- API token for Atlassian. You can create on from [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

### Steps
1. **Clone the repository:**
   ```sh
   git clone https://github.com/Parthav46/atlassian-mcp.git
   cd atlassian-mcp
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment:**
   - You can set configuration options using command-line arguments or environment variables:
     - `--base-url <Confluence or Jira base URL>`
     - `--token <User token>`
     - `--username <Username>`
   - These arguments override environment variables if both are set.
4. **Build the project:**
   ```sh
   npm run build
   ```
5. **Run the server using npx:**
   ```sh
   npx atlassian-mcp --base-url <Confluence or Jira base URL> --token <User token> --username <Username>
   ```
   - You can also use environment variables instead of command-line arguments.

## MCP Server setup

**Create MCP JSON config for Copilot or Claude for Desktop:**
   - Add the following content to configure your MCP server:
     ```json
     {
       "command": "npx",
       "type": "stdio",
       "args": [
         "atlassian-mcp@latest"
       ],
       "env": {
         "ATLASSIAN_BASE_URL": "<Your Jira Base URL>",
         "ATLASSIAN_API_TOKEN": "<Your Atlassian API Token>",
         "ATLASSIAN_USERNAME": "<Your Atlassian Username>"
       }
     }
     ```
   - Replace the placeholders with your actual configuration values.
   - This configuration works for both GitHub Copilot and Claude for Desktop.

## Scripts
- `npm run build` — Compile TypeScript
- `npm start` — Run the server using compiled JS
- `npm run dev` — Run the server with ts-node (for development)

---

## License

This project is licensed under the [MIT License](./LICENSE).
This project was created entirely using GitHub Copilot with GPT-4.1.
