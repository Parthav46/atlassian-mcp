import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MockAtlassianServer } from './mock-server';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(45000);

describe('End-to-End Workflow Integration Tests', () => {
  let transport: StdioClientTransport | undefined;
  let client: Client;
  let mockServer: MockAtlassianServer;
  let mockBaseUrl: string;

  beforeAll(async () => {
    mockServer = new MockAtlassianServer(3005);
    mockBaseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(async () => {
    mockBaseUrl = await mockServer.clearRoutes();
    
    const serverPath = path.join(__dirname, '../../dist/src/index.js');
    transport = new StdioClientTransport({
      command: 'node',
      args: [
        serverPath,
        '--base-url', mockBaseUrl,
        '--token', 'mock-token',
        '--username', 'test@example.com'
      ]
    });
    client = new Client({
      name: 'integration-test-client',
      version: '1.0.0'
    });
    await client.connect(transport);
  });

  afterEach(async () => {
    if (transport && typeof transport.close === 'function') {
      await transport.close();
    }
    transport = undefined;
  });

  describe('Project Documentation Workflow', () => {
    it('should create project documentation from Jira issues to Confluence pages', async () => {
      // Step 1: Search for Jira issues in a project
      const mockJiraSearch = {
        issues: [
          {
            key: 'PROJ-123',
            fields: {
              summary: 'Implement user authentication',
              status: { name: 'Done' },
              assignee: { displayName: 'John Doe' },
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Implement OAuth2 authentication system' }
                    ]
                  }
                ]
              }
            }
          },
          {
            key: 'PROJ-124',
            fields: {
              summary: 'Create API documentation',
              status: { name: 'In Progress' },
              assignee: { displayName: 'Jane Smith' },
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Document REST API endpoints' }
                    ]
                  }
                ]
              }
            }
          }
        ],
        total: 2,
        isLast: true
      };

      mockServer.mockJiraSearch(mockJiraSearch);

      const searchResult = await client.callTool({
        name: 'search-jira-issues',
        arguments: { jql: 'project = PROJ AND status in ("Done", "In Progress")' }
      });

      expect((searchResult as any).content[0].text).toContain('PROJ-123');
      expect((searchResult as any).content[0].text).toContain('PROJ-124');

      // Step 2: Get detailed information about specific issue
      const mockIssueDetail = {
        key: 'PROJ-123',
        fields: {
          summary: 'Implement user authentication',
          status: { name: 'Done' },
          assignee: { displayName: 'John Doe' },
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Implement OAuth2 authentication system with JWT tokens' }
                ]
              }
            ]
          },
          subtasks: []
        }
      };

      mockServer.mockJiraIssue('PROJ-123', mockIssueDetail);

      const issueResult = await client.callTool({
        name: 'get-jira-issue',
        arguments: { issueKey: 'PROJ-123' }
      });

      expect((issueResult as any).content[0].text).toContain('OAuth2 authentication system');

      // Step 3: Find appropriate space for documentation
      const mockSpaces = {
        results: [
          {
            id: '98765',
            key: 'PROJ',
            name: 'Project Documentation',
            type: 'global',
            status: 'current'
          }
        ]
      };

      mockServer.mockConfluenceSpaces(mockSpaces);

      const spacesResult = await client.callTool({
        name: 'list-spaces',
        arguments: { keys: 'PROJ' }
      });

      expect((spacesResult as any).content[0].text).toContain('Project Documentation (KEY: PROJ, ID: 98765)');

      // Step 4: Create documentation page
      const mockCreatedPage = {
        id: '345678',
        title: 'Authentication Implementation - PROJ-123',
        _links: {
          webui: '/spaces/PROJ/pages/345678'
        }
      };

      mockServer.mockConfluenceSpaces(mockSpaces);
      mockServer.mockConfluenceCreatePage(mockCreatedPage);

      const createPageResult = await client.callTool({
        name: 'create-page',
        arguments: {
          spaceKey: 'PROJ',
          title: 'Authentication Implementation - PROJ-123',
          body: '<h1>Authentication Implementation</h1><p>Based on PROJ-123: Implement OAuth2 authentication system with JWT tokens</p><p>Status: Done</p><p>Assignee: John Doe</p>'
        }
      });

      expect((createPageResult as any).content[0].text).toContain('Created page: Authentication Implementation - PROJ-123');

      // Step 5: Search for the created documentation
      const mockConfluenceSearch = {
        results: [
          {
            title: 'Authentication Implementation - PROJ-123',
            excerpt: 'Based on PROJ-123: Implement OAuth2 authentication system',
            url: '/wiki/spaces/PROJ/pages/345678',
            lastModified: '2024-01-01T10:00:00.000Z'
          }
        ],
        totalSize: 1,
        cqlQuery: 'space = PROJ AND title ~ "Authentication"'
      };

      mockServer.mockConfluenceCqlSearch(mockConfluenceSearch);

      const searchConfluenceResult = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'space = PROJ AND title ~ "Authentication"' }
      });

      expect((searchConfluenceResult as any).content[0].text).toContain('Authentication Implementation - PROJ-123');
    });
  });

  describe('Issue Lifecycle Management Workflow', () => {
    it('should create, update, and manage Jira issues', async () => {
      // Step 1: Create a new issue
      const mockCreatedIssue = {
        key: 'TEST-200',
        id: '54321'
      };

      mockServer.mockJiraCreateIssue(mockCreatedIssue);

      const createResult = await client.callTool({
        name: 'create-jira-issue',
        arguments: {
          issueData: {
            fields: {
              project: { id: '10000' },
              summary: 'New feature request',
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Implement new feature for user management' }]
                  }
                ]
              },
              issuetype: { id: '10001' }
            }
          }
        }
      });

      expect((createResult as any).content[0].text).toContain('Created issue: TEST-200');

      // Step 2: Update the issue
      mockServer.mockJiraUpdateIssue('TEST-200');

      const updateResult = await client.callTool({
        name: 'update-jira-issue',
        arguments: {
          issueKey: 'TEST-200',
          issueData: {
            fields: {
              project: { id: '10000' },
              summary: 'Enhanced feature request - User Management',
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Implement enhanced user management with role-based access' }]
                  }
                ]
              },
              issuetype: { id: '10001' }
            }
          }
        }
      });

      expect((updateResult as any).content[0].text).toContain('Updated issue: TEST-200');

      // Step 3: Verify the update by getting the issue
      const mockUpdatedIssue = {
        key: 'TEST-200',
        fields: {
          summary: 'Enhanced feature request - User Management',
          status: { name: 'To Do' },
          assignee: { displayName: 'System Admin' },
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Implement enhanced user management with role-based access' }
                ]
              }
            ]
          },
          subtasks: []
        }
      };

      mockServer.mockJiraIssue('TEST-200', mockUpdatedIssue);

      const getResult = await client.callTool({
        name: 'get-jira-issue',
        arguments: { issueKey: 'TEST-200' }
      });

      expect((getResult as any).content[0].text).toContain('Enhanced feature request - User Management');
      expect((getResult as any).content[0].text).toContain('role-based access');
    });
  });

  describe('Knowledge Base Search Workflow', () => {
    it('should search across Jira and Confluence for related information', async () => {
      // Step 1: Search Jira for issues related to "authentication"
      const mockJiraAuthSearch = {
        issues: [
          {
            key: 'SEC-101',
            fields: {
              summary: 'Authentication security review',
              status: { name: 'Done' },
              assignee: { displayName: 'Security Team' }
            }
          }
        ],
        total: 1,
        isLast: true
      };

      mockServer.mockJiraSearch(mockJiraAuthSearch);

      const jiraSearchResult = await client.callTool({
        name: 'search-jira-issues',
        arguments: { jql: 'summary ~ "authentication" OR description ~ "authentication"' }
      });

      expect((jiraSearchResult as any).content[0].text).toContain('SEC-101');

      // Step 2: Search Confluence for related documentation
      const mockConfluenceAuthSearch = {
        results: [
          {
            title: 'Authentication Best Practices',
            excerpt: 'Guidelines for implementing secure authentication',
            url: '/wiki/spaces/SEC/pages/111111',
            lastModified: '2024-01-01T10:00:00.000Z'
          },
          {
            title: 'OAuth2 Implementation Guide',
            excerpt: 'Step-by-step guide for OAuth2 implementation',
            url: '/wiki/spaces/DEV/pages/222222',
            lastModified: '2024-01-05T10:00:00.000Z'
          }
        ],
        totalSize: 2,
        cqlQuery: 'text ~ "authentication"'
      };

      mockServer.mockConfluenceCqlSearch(mockConfluenceAuthSearch);

      const confluenceSearchResult = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'text ~ "authentication"' }
      });

      expect((confluenceSearchResult as any).content[0].text).toContain('Authentication Best Practices');
      expect((confluenceSearchResult as any).content[0].text).toContain('OAuth2 Implementation Guide');

      // Step 3: Get detailed page information
      const mockAuthPage = {
        id: '111111',
        title: 'Authentication Best Practices',
        body: {
          storage: {
            value: '<h1>Authentication Best Practices</h1><p>Always use strong password policies and multi-factor authentication.</p>',
            representation: 'storage'
          }
        },
        _links: {
          webui: '/spaces/SEC/pages/111111'
        }
      };

      mockServer.mockConfluencePage('111111', mockAuthPage);

      const pageResult = await client.callTool({
        name: 'get-page',
        arguments: { pageId: 111111 }
      });

      expect((pageResult as any).content[0].text).toContain('Authentication Best Practices');
      expect((pageResult as any).content[0].text).toContain('multi-factor authentication');
    });
  });

  describe('Error Handling and Recovery Workflow', () => {
    it('should handle API errors gracefully and provide meaningful feedback', async () => {
      // Test API rate limiting
      mockServer.mockError('/rest/api/3/issue/RATE-LIMIT', 'GET', 429, { 
        errorMessages: ['Rate limit exceeded']
      });

      const rateLimitResult = await client.callTool({
        name: 'get-jira-issue',
        arguments: { issueKey: 'RATE-LIMIT' }
      });

      expect((rateLimitResult as any).content[0].text).toContain('Request failed with status code 429');

      // Test authentication errors
      mockServer.mockError('/rest/api/3/issue/AUTH-FAIL', 'GET', 401, { 
        errorMessages: ['Authentication failed']
      });

      const authFailResult = await client.callTool({
        name: 'get-jira-issue',
        arguments: { issueKey: 'AUTH-FAIL' }
      });

      expect((authFailResult as any).content[0].text).toContain('Request failed with status code 401');

      // Test malformed requests
      mockServer.mockError('/rest/api/3/search/jql', 'POST', 400, { 
        errorMessages: ['Invalid JQL query']
      });

      const malformedResult = await client.callTool({
        name: 'search-jira-issues',
        arguments: { jql: 'invalid jql syntax here' }
      });

      expect((malformedResult as any).content[0].text).toContain('Request failed with status code 400');
    });
  });
});
