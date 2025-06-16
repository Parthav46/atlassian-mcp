# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2] - 2025-06-16
### Added
- Shebang added to `index.ts` for executable script support.
- CQL tools added for Confluence queries.

### Changed
- Refactored: Commented out `registerJiraTools` import and usage in `registerTools`.
- Enhanced: Implemented improved `searchIssues` method and updated related tools.
- Enhanced: `get-jira-issue` tool now parses Atlassian doc format descriptions.
- Refactored: Moved `parseJiraDescription` and `parseJiraSubtasks` to `jiraUtils`.
- Reorganized: Moved tools into `confluence` and `jira` directories for better structure.

## [0.1.1] - 2025-06-16
### Changed
- Refactored Confluence endpoints and related logic for improved compatibility with Large Language Models (LLMs).
- Enhanced request and response handling for Confluence APIs to provide cleaner, more LLM-friendly outputs.
- Improved error handling and data extraction from Confluence pages and spaces.
- Updated internal documentation and code comments for clarity.

### Fixed
- Issues with content formatting and retrieval from Confluence APIs.

### Note
- No breaking changes to public APIs. All changes are backward compatible and focused on LLM integration improvements.

## [0.1.0] - 2025-06-15
### Added
- Initial release with basic Confluence and Jira client functionality.
- Core endpoints for interacting with Atlassian Confluence and Jira APIs.
- Basic error handling and response formatting.
