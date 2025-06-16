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
     - `--token=<User token>`
     - `--username=<Username>`
   - These arguments override environment variables if both are set.
4. **Build the project:**
   ```sh
   npm run build
   ```
5. **Run the server using npx:**
   ```sh
   npx atlassian-mcp --base-url=<Confluence or Jira base URL> --token=<User token> --username=<Username>
   ```
   - You can also use environment variables instead of command-line arguments.

6. **Create MCP JSON config for Copilot or Claude for Desktop:**
   - Create a file named `mcp.json` in your project root with the following content:
     ```json
     {
       "command": "npx",
       "type": "stdio",
       "args": [
         "atlassian-mcp"
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

## Usage via npx (published package)

Once the package is published to npm, you can run the server directly without cloning or building:

```sh
npx atlassian-mcp --base-url=<Confluence or Jira base URL> --token=<User token> --username=<Username>
```

## Scripts
- `npm run build` — Compile TypeScript
- `npm start` — Run the server using compiled JS
- `npm run dev` — Run the server with ts-node (for development)

---

## License

This project is licensed under the [MIT License](./LICENSE).
This project was created entirely using GitHub Copilot with GPT-4.1.
