import { registerJiraResources } from '../../../src/resources/jira/registerJiraResources';
import { JiraClient } from '../../../src/clients/jiraClient';
import type { AtlassianConfig } from '../../../src/clients/atlassianConfig';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

// Mock the JiraClient
jest.mock('../../../src/clients/jiraClient');
const MockedJiraClient = JiraClient as jest.MockedClass<typeof JiraClient>;

// Mock ResourceTemplate
jest.mock('@modelcontextprotocol/sdk/server/mcp', () => ({
  ResourceTemplate: jest.fn().mockImplementation(() => ({})),
}));

describe('registerJiraResources', () => {
  let server: jest.Mocked<McpServer>;
  let config: AtlassianConfig;

  beforeEach(() => {
    server = {
      resource: jest.fn(),
    } as unknown as jest.Mocked<McpServer>;
    
    config = {
      baseUrl: 'https://test.atlassian.net',
      token: 'test-token',
      username: 'test-user'
    };
    
    jest.clearAllMocks();
  });

  it('registers jira-issue resource', () => {
    registerJiraResources(server, config);
    expect(server.resource).toHaveBeenCalledWith(
      'jira-issue',
      expect.any(Object), // ResourceTemplate
      expect.objectContaining({
        description: expect.stringContaining('Get a Jira issue by key'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
  });

  it('registers jira-search resource', () => {
    registerJiraResources(server, config);
    expect(server.resource).toHaveBeenCalledWith(
      'jira-search',
      expect.any(Object), // ResourceTemplate
      expect.objectContaining({
        description: expect.stringContaining('Search Jira issues using JQL'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
  });

  it('jira-issue resource handler gets issue correctly', async () => {
    const mockGetIssue = jest.fn().mockResolvedValue({
      data: {
        key: 'TEST-123',
        fields: {
          summary: 'Test Issue',
          status: { name: 'Open' },
          assignee: { displayName: 'John Doe' },
          reporter: { displayName: 'Jane Doe' },
          project: { name: 'Test Project' },
          issuetype: { name: 'Bug' },
          priority: { name: 'High' },
          created: '2023-01-01T00:00:00.000Z',
          updated: '2023-01-02T00:00:00.000Z',
          description: null,
          subtasks: []
        }
      }
    });
    MockedJiraClient.prototype.getIssue = mockGetIssue;

    registerJiraResources(server, config);
    
    // Get the resource handler function (4th argument of the first resource call)
    const resourceCall = server.resource.mock.calls.find(call => call[0] === 'jira-issue');
    expect(resourceCall).toBeDefined();
    const handler = resourceCall![3];
    
    const uri = new URL('jira://issue/TEST-123');
    const variables = { key: 'TEST-123' };
    const extra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    const result = await handler(uri, variables, extra);
    
    expect(mockGetIssue).toHaveBeenCalledWith('TEST-123');
    expect(result).toEqual({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: expect.stringContaining('"key": "TEST-123"')
        }
      ]
    });
  });

  it('jira-search resource handler searches issues correctly', async () => {
    const mockSearchIssues = jest.fn().mockResolvedValue({
      data: {
        isLast: true,
        nextPageToken: undefined,
        issues: [
          { key: 'TEST-123', fields: { summary: 'Test Issue 1' } },
          { key: 'TEST-124', fields: { summary: 'Test Issue 2' } }
        ]
      }
    });
    MockedJiraClient.prototype.searchIssues = mockSearchIssues;

    registerJiraResources(server, config);
    
    // Get the resource handler function for jira-search
    const resourceCall = server.resource.mock.calls.find(call => call[0] === 'jira-search');
    expect(resourceCall).toBeDefined();
    const handler = resourceCall![3];
    
    const uri = new URL('jira://search/project%3DTEST');
    const variables = { jql: 'project=TEST' };
    const extra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    const result = await handler(uri, variables, extra);
    
    expect(mockSearchIssues).toHaveBeenCalledWith({
      jql: 'project=TEST',
      maxResults: 50,
      fields: ['summary', 'status', 'assignee', 'description']
    });
    expect(result).toEqual({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: expect.stringContaining('"searchQuery": "project=TEST"')
        }
      ]
    });
  });

  it('jira-issue resource handler throws error for missing key', async () => {
    registerJiraResources(server, config);
    
    const resourceCall = server.resource.mock.calls.find(call => call[0] === 'jira-issue');
    const handler = resourceCall![3];
    
    const uri = new URL('jira://issue/');
    const variables = {};
    const extra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    
    await expect(handler(uri, variables, extra)).rejects.toThrow('Issue key is required');
  });

  it('jira-search resource handler throws error for missing jql', async () => {
    registerJiraResources(server, config);
    
    const resourceCall = server.resource.mock.calls.find(call => call[0] === 'jira-search');
    const handler = resourceCall![3];
    
    const uri = new URL('jira://search/');
    const variables = {};
    const extra = {
      signal: new AbortController().signal,  
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    
    await expect(handler(uri, variables, extra)).rejects.toThrow('JQL query is required');
  });
});