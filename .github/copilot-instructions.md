# Copilot Instructions for Atlassian MCP Server

## Core Commands

### Build & Development
- `npm run build` - Compile TypeScript to `dist/`
- `npm start` - Run compiled server
- `npm run dev` - Run with ts-node for development
- `npm run clean` - Clean build artifacts

### Testing
- `npm test` - Unit tests (excludes integration)
- `npm run test:integration` - Integration tests only
- `npm run test:coverage` - Unit tests with coverage
- `npm run test:integration:coverage` - Integration tests with coverage
- Jest runs from `<rootDir>/tests` and `<rootDir>/src`

### Linting & Code Quality
- `npm run lint` - ESLint with TypeScript rules
- ESLint config: extends `eslint:recommended` and `@typescript-eslint/recommended`

### Installation & Setup
- `npm install` - Install dependencies
- Requires Node.js v18+, Atlassian API token
- Environment variables: `ATLASSIAN_BASE_URL`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_USERNAME`
- CLI args override env vars: `--base-url`, `--token`, `--username`

## Architecture

### Core Structure
- **Entry Point**: `src/index.ts` - MCP server with stdio transport
- **Tool Registration**: `src/registerTools.ts` - Loads config and registers all tools
- **Clients**: API clients for Atlassian services
  - `confluenceClient.ts` - Confluence REST API client
  - `jiraClient.ts` - Jira REST API client
  - `atlassianConfig.ts` - Shared configuration interface

### Tool Modules
- **Confluence Tools**:
  - `registerPageTools.ts` - CRUD operations for pages
  - `registerSpaceTools.ts` - Space and folder management
  - `registerCqlTools.ts` - Advanced CQL search functionality
- **Jira Tools**:
  - `registerJiraTools.ts` - Issue CRUD operations and JQL search
  - `jiraUtils.ts` - ADF parsing utilities for descriptions/subtasks

### Key Dependencies
- `@modelcontextprotocol/sdk` - MCP server framework
- `axios` - HTTP client for API calls
- `zod` - Schema validation for tool inputs
- `dotenv` - Environment configuration
- TypeScript with strict mode enabled

### Data Flow
1. CLI args/env vars → `getAtlassianConfig()` → frozen config object
2. Config passed to each tool registration function
3. Tools create API clients with config for authentication
4. MCP tools use Zod schemas for input validation

## Style & Code Rules

### TypeScript
- Strict mode enabled (`"strict": true`)
- Target ES2016, CommonJS modules
- Source maps enabled for debugging
- Output to `./dist`

### ESLint Configuration
- Use `/* eslint-disable @typescript-eslint/no-explicit-any */` only when necessary (API error handlers, dynamic Jira fields)
- Prefer `/* eslint-disable-next-line */` for single-line suppressions
- Current environment: Node.js, ES2021, Jest

### Error Handling
- API clients have dedicated error handlers (`confluenceErrorHandler`, `jiraErrorHandler`)
- Log structured error objects with URL, status, and response data
- Always reject promises after logging errors
- Return user-friendly error messages in tool responses

### Naming Conventions
- Tool names use kebab-case: `get-jira-issue`, `confluence_search`
- File names use camelCase: `registerPageTools.ts`
- Functions use camelCase: `parseJiraDescription`
- Constants use UPPER_SNAKE_CASE: `ATLASSIAN_BASE_URL`

### Code Organization
- Group related tools in modules (Confluence/Jira separation)
- Use separate utility files for complex parsing logic
- Keep tool handlers focused - delegate to client methods
- Always include Zod schemas for tool input validation

### Testing Patterns
- Mock external clients using `jest.MockedClass`
- Test tool registration separately from tool handlers
- Include edge cases: missing fields, empty responses, error conditions
- Use `beforeEach` to clear mocks and reset state
- Structure: one describe block per tool, multiple test cases per handler

### Import Organization
- External libraries first
- Internal modules grouped by type (clients, tools, types)
- Use type imports where appropriate: `import type { McpServer }`

## MCP-Specific Guidelines

### Tool Design
- Tools return `{ content: [{ type: "text", text: string }] }`
- Use descriptive tool names and comprehensive Zod schemas
- Include optional parameters with clear descriptions
- Handle empty/missing data gracefully with user-friendly messages

### Configuration Management
- CLI arguments take precedence over environment variables
- Configuration is frozen to prevent modification
- Pass config explicitly to all tool registration functions

### Error Responses
- Return structured error messages, not exceptions
- Include relevant context (issue keys, page IDs, etc.)
- Use consistent formatting for success/error responses
