# MCP Resources

This document describes the available MCP resources in the Atlassian MCP server. Resources are read-only endpoints that provide structured access to Atlassian data using URI templates.

## Jira Resources

### Jira Issue Resource
- **Resource Name**: `jira-issue`
- **URI Template**: `jira://issue/{key}`
- **Description**: Get a Jira issue by key. Returns issue details including description and subtasks.
- **Variables**:
  - `key`: The Jira issue key (e.g., "PROJECT-123")

**Example URI**: `jira://issue/PROJECT-123`

**Response**: JSON object containing:
- `key`: Issue key
- `summary`: Issue summary
- `status`: Current status
- `assignee`: Assigned user
- `reporter`: Reporter user
- `project`: Project name
- `issueType`: Issue type
- `priority`: Priority level
- `created`: Creation date
- `updated`: Last update date
- `description`: Parsed description text
- `subtasks`: Array of subtask information
- `webUrl`: Direct link to the issue

### Jira Search Resource
- **Resource Name**: `jira-search`
- **URI Template**: `jira://search/{jql}`
- **Description**: Search Jira issues using JQL (Jira Query Language)
- **Variables**:
  - `jql`: URL-encoded JQL query string (e.g., "project=TEST")
- **Query Parameters**:
  - `maxResults`: Maximum number of results (default: 50)
  - `fields`: Comma-separated list of fields to include
  - `nextPageToken`: Token for pagination
  - `expand`: Additional information to include

**Example URI**: `jira://search/project%3DTEST?maxResults=10&fields=summary,status`

**Response**: JSON object containing:
- `searchQuery`: The JQL query used
- `total`: Total number of matching issues
- `maxResults`: Maximum results per page
- `startAt`: Starting index
- `isLast`: Whether this is the last page
- `nextPageToken`: Token for next page
- `issues`: Array of matching issues

## Confluence Resources

### Confluence Page Resource
- **Resource Name**: `confluence-page`
- **URI Template**: `confluence://page/{id}`
- **Description**: Get a Confluence page by ID with content in storage format
- **Variables**:
  - `id`: The Confluence page ID
- **Query Parameters**:
  - `format`: Content format ("storage" or "markdown", default: "storage")

**Example URI**: `confluence://page/123456?format=storage`

**Response**: JSON object containing:
- `id`: Page ID
- `title`: Page title
- `type`: Page type
- `status`: Page status
- `version`: Version information
- `webUrl`: Direct link to the page
- `contentFormat`: Format of the content
- `content`: Page content in the specified format

### Confluence Page Children Resource
- **Resource Name**: `confluence-page-children`
- **URI Template**: `confluence://page/{id}/children`
- **Description**: Get children pages of a Confluence page by ID
- **Variables**:
  - `id`: The Confluence page ID

**Example URI**: `confluence://page/123456/children`

**Response**: JSON object containing:
- `parentPageId`: ID of the parent page
- `childrenCount`: Number of child pages
- `children`: Array of child page information

### Confluence Space Resource
- **Resource Name**: `confluence-space`
- **URI Template**: `confluence://space/{id}`
- **Description**: Get a Confluence space by ID
- **Variables**:
  - `id`: The Confluence space ID

**Example URI**: `confluence://space/98765`

**Response**: JSON object containing:
- `id`: Space ID
- `key`: Space key
- `name`: Space name
- `type`: Space type
- `status`: Space status
- `description`: Space description
- `webUrl`: Direct link to the space

### Confluence Folder Resource
- **Resource Name**: `confluence-folder`
- **URI Template**: `confluence://folder/{id}`
- **Description**: Get a Confluence folder by ID
- **Variables**:
  - `id`: The Confluence folder ID

**Example URI**: `confluence://folder/45678`

**Response**: JSON object containing:
- `id`: Folder ID
- `name`: Folder name
- `description`: Folder description
- `webUrl`: Direct link to the folder

### Confluence Spaces List Resource
- **Resource Name**: `confluence-spaces`
- **URI**: `confluence://spaces`
- **Description**: List all Confluence spaces with optional filtering
- **Query Parameters**:
  - `start`: Starting index for pagination
  - `limit`: Maximum number of results
  - `keys`: Comma-separated list of space keys to filter by

**Example URI**: `confluence://spaces?limit=20&start=0`

**Response**: JSON object containing:
- `total`: Total number of spaces returned
- `start`: Starting index
- `limit`: Results limit
- `spaces`: Array of space information

### Confluence Search Resource
- **Resource Name**: `confluence-search`
- **URI Template**: `confluence://search/{cql}`
- **Description**: Advanced Confluence search using CQL (Confluence Query Language)
- **Variables**:
  - `cql`: URL-encoded CQL query string (e.g., "type=page")
- **Query Parameters**:
  - `limit`: Maximum number of results
  - `start`: Starting index for pagination

**Example URI**: `confluence://search/type%3Dpage?limit=10`

**Response**: JSON object containing:
- `searchQuery`: The CQL query used
- `total`: Total number of matching results
- `start`: Starting index
- `limit`: Results limit
- `results`: Array of matching content items

## Usage

These resources are automatically registered when the Atlassian MCP server starts. They can be accessed by MCP-compatible clients using the URI patterns described above.

### Configuration

Resources use the same authentication configuration as the tools:
- `ATLASSIAN_BASE_URL`: Your Atlassian instance URL
- `ATLASSIAN_API_TOKEN`: Your API token
- `ATLASSIAN_USERNAME`: Your username

### Content Types

All resources return data with `mimeType: "application/json"` and provide structured JSON responses for easy consumption by language models and other clients.