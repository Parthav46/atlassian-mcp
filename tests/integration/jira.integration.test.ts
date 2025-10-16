import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MockAtlassianServer } from './mock-server';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(30000);

describe('Jira Tools Integration Tests', () => {
  let transport: StdioClientTransport | undefined;
  let client: Client;
  let mockServer: MockAtlassianServer;
  let mockBaseUrl: string;

  beforeAll(async () => {
    // Start mock server on a different port to avoid conflicts
    mockServer = new MockAtlassianServer(3002);
    mockBaseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(async () => {
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
    mockBaseUrl = await mockServer.clearRoutes();
  });

  describe('get-jira-issue', () => {
    it('should retrieve a Jira issue successfully', async () => {
      const mockIssue = {
        key: 'TEST-123',
        fields: {
          summary: 'Test Issue Summary',
          status: { name: 'In Progress' },
          assignee: { displayName: 'John Doe' },
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'This is a test description' }
                ]
              }
            ]
          },
          subtasks: []
        }
      };

      mockServer.mockJiraIssue('TEST-123', mockIssue);

      const result = await client.callTool({
        name: 'get-jira-issue',
        arguments: { issueKey: 'TEST-123' }
      });

      expect((result as any).content[0].text).toContain('Key: TEST-123');
      expect((result as any).content[0].text).toContain('Summary: Test Issue Summary');
      expect((result as any).content[0].text).toContain('Status: In Progress');
      expect((result as any).content[0].text).toContain('Assignee: John Doe');
      expect((result as any).content[0].text).toContain(`URL: ${mockBaseUrl}/browse/TEST-123`);
    });

    it('should handle issue not found error', async () => {
      mockServer.mockJiraIssue('NONEXISTENT-123', { errorMessages: ['Issue does not exist or you do not have permission to see it.'] }, 404);

      const result = await client.callTool({
        name: 'get-jira-issue',
        arguments: { issueKey: 'NONEXISTENT-123' }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 404');
    });
  });

  describe('search-jira-issues', () => {
    it('should search issues with basic JQL', async () => {
      const mockSearchResponse = {
        issues: [
          {
            key: 'TEST-123',
            fields: {
              summary: 'First Issue',
              status: { name: 'To Do' },
              assignee: { displayName: 'Alice Smith' }
            }
          },
          {
            key: 'TEST-124',
            fields: {
              summary: 'Second Issue',
              status: { name: 'Done' },
              assignee: { displayName: 'Bob Johnson' }
            }
          }
        ],
        total: 2,
        isLast: true
      };

      mockServer.mockJiraSearch(mockSearchResponse);

      const result = await client.callTool({
        name: 'search-jira-issues',
        arguments: { jql: 'project = TEST' }
      });

      expect((result as any).content[0].text).toContain('Size:2');
      expect((result as any).content[0].text).toContain('IsLastPage:true');
      expect((result as any).content[0].text).toContain('TEST-123');
      expect((result as any).content[0].text).toContain('First Issue');
    });

    it('should handle empty search results', async () => {
      const mockSearchResponse = {
        issues: [],
        total: 0,
        isLast: true
      };

      mockServer.mockJiraSearch(mockSearchResponse);

      const result = await client.callTool({
        name: 'search-jira-issues',
        arguments: { jql: 'project = EMPTY' }
      });

      expect((result as any).content[0].text).toContain('No issues found');
    });

    it('should handle pagination parameters', async () => {
      const mockSearchResponse = {
        issues: [
          {
            key: 'TEST-125',
            fields: {
              summary: 'Paginated Issue',
              status: { name: 'In Progress' }
            }
          }
        ],
        total: 50,
        isLast: false,
        nextPageToken: 'next-page-token-123'
      };

      mockServer.mockJiraSearch(mockSearchResponse);

      const result = await client.callTool({
        name: 'search-jira-issues',
        arguments: { 
          jql: 'project = TEST',
          maxResults: 1,
          nextPageToken: 'some-token'
        }
      });

      expect((result as any).content[0].text).toContain('IsLastPage:false');
      expect((result as any).content[0].text).toContain('NextPageToken:next-page-token-123');
    });
  });

  describe('create-jira-issue', () => {
    it('should create a new issue successfully', async () => {
      const mockCreatedIssue = {
        key: 'TEST-125',
        id: '12345'
      };

      mockServer.mockJiraCreateIssue(mockCreatedIssue);

      const result = await client.callTool({
        name: 'create-jira-issue',
        arguments: {
          issueData: {
            fields: {
              project: { id: '10000' },
              summary: 'New Test Issue',
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Test description' }]
                  }
                ]
              },
              issuetype: { id: '10001' }
            }
          }
        }
      });

      expect((result as any).content[0].text).toContain('Created issue: TEST-125');
      expect((result as any).content[0].text).toContain(`URL: ${mockBaseUrl}/browse/TEST-125`);
    });

    it('should handle creation errors', async () => {
      mockServer.mockJiraCreateIssue({ 
        errorMessages: ['Field "summary" is required.']
      }, 400);

      const result = await client.callTool({
        name: 'create-jira-issue',
        arguments: {
          issueData: {
            fields: {
              project: { id: '10000' },
              summary: 'Test Issue',
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Test description' }]
                  }
                ]
              },
              issuetype: { id: '10001' }
            }
          }
        }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 400');
    });
  });

  describe('update-jira-issue', () => {
    it('should update an issue successfully', async () => {
      mockServer.mockJiraUpdateIssue('TEST-123');

      const result = await client.callTool({
        name: 'update-jira-issue',
        arguments: {
          issueKey: 'TEST-123',
          issueData: {
            fields: {
              project: { id: '10000' },
              summary: 'Updated Test Issue',
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Updated description' }]
                  }
                ]
              },
              issuetype: { id: '10001' }
            }
          }
        }
      });

      expect((result as any).content[0].text).toContain('Updated issue: TEST-123');
    });
  });

  describe('delete-jira-issue', () => {
    it('should delete an issue successfully', async () => {
      mockServer.mockJiraDeleteIssue('TEST-123');

      const result = await client.callTool({
        name: 'delete-jira-issue',
        arguments: { issueKey: 'TEST-123' }
      });

      expect((result as any).content[0].text).toContain('Deleted issue: TEST-123');
    });

    it('should handle deletion errors', async () => {
      mockServer.mockJiraDeleteIssue('TEST-123', 403);

      const result = await client.callTool({
        name: 'delete-jira-issue',
        arguments: { issueKey: 'TEST-123' }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 403');
    });
  });
});
