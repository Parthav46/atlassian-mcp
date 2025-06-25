import { registerJiraTools } from '../../../src/tools/jira/registerJiraTools';
import { JiraClient } from '../../../src/clients/jiraClient';
import { AtlassianConfig } from '../../../src/clients/atlassianConfig';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

jest.mock('../../../src/clients/jiraClient');
const MockedJiraClient = JiraClient as jest.MockedClass<typeof JiraClient>;

describe('registerJiraTools', () => {
  let server: { tool: jest.Mock };
  let config: AtlassianConfig;

  beforeEach(() => {
    server = { tool: jest.fn() };
    config = {
      baseUrl: 'https://example.atlassian.net',
      token: 'dummy-token',
      username: 'dummy-user'
    };
    MockedJiraClient.mockClear();
  });

  it('registers all expected tools', () => {
    registerJiraTools(server as unknown as McpServer, config);
    expect(server.tool).toHaveBeenCalledTimes(5);
    const toolNames = server.tool.mock.calls.map((call: unknown[]) => call[0]);
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'get-jira-issue',
        'search-jira-issues',
        'create-jira-issue',
        'update-jira-issue',
        'delete-jira-issue',
      ])
    );
  });

  it('get-jira-issue handler returns expected data', async () => {
    const mockGetIssue = jest.fn().mockResolvedValue({
      data: {
        key: 'JIRA-1',
        fields: {
          summary: 'Test summary',
          status: { name: 'To Do' },
          assignee: { displayName: 'Alice' },
          description: 'desc',
        },
      },
    });
    MockedJiraClient.prototype.getIssue = mockGetIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const getIssueCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-jira-issue');
    expect(getIssueCall).toBeDefined();
    const handler = getIssueCall[3];
    const result = await handler({ issueKey: 'JIRA-1' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-1\n' +
            'Summary: Test summary\n' +
            'Status: To Do\n' +
            'Assignee: Alice\n' +
            'URL: https://example.atlassian.net/browse/JIRA-1\n' +
            'Description:\ndesc\n'
        }
      ]
    });
    expect(mockGetIssue).toHaveBeenCalledWith('JIRA-1');
  });

  it('get-jira-issue handler handles missing fields', async () => {
    const mockGetIssue = jest.fn().mockResolvedValue({
      data: {
        key: 'JIRA-7',
        fields: {}
      },
    });
    MockedJiraClient.prototype.getIssue = mockGetIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const getIssueCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-jira-issue');
    const handler = getIssueCall[3];
    const result = await handler({ issueKey: 'JIRA-7' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-7\n' +
            'Summary: \n' +
            'Status: \n' +
            'Assignee: Unassigned\n' +
            'URL: https://example.atlassian.net/browse/JIRA-7\n'
        }
      ]
    });
  });

  it('get-jira-issue handler parses Atlassian doc format description and subtasks', async () => {
    const mockGetIssue = jest.fn().mockResolvedValue({
      data: {
        key: 'JIRA-100',
        fields: {
          summary: 'Dummy summary',
          status: { name: 'In Progress' },
          assignee: { displayName: 'John Doe' },
          description: {
            type: 'doc',
            version: 1,
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'This is a dummy description.' }] },
              { type: 'paragraph', content: [{ type: 'text', text: 'Includes:' }] },
              { type: 'orderedList', attrs: { order: 1 }, content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First item' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second item' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Third item' }] }] }
              ]}
            ]
          },
          subtasks: [
            {
              key: 'JIRA-101',
              fields: { summary: 'Dummy subtask 1', status: { name: 'Done' } }
            },
            {
              key: 'JIRA-102',
              fields: { summary: 'Dummy subtask 2', status: { name: 'In Progress' } }
            }
          ]
        },
      },
    });
    MockedJiraClient.prototype.getIssue = mockGetIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const getIssueCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-jira-issue');
    const handler = getIssueCall[3];
    const result = await handler({ issueKey: 'JIRA-100' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-100\n' +
            'Summary: Dummy summary\n' +
            'Status: In Progress\n' +
            'Assignee: John Doe\n' +
            'URL: https://example.atlassian.net/browse/JIRA-100\n' +
            'Description:\n' +
            'This is a dummy description.\n' +
            'Includes:\n' +
            '1. First item\n' +
            '2. Second item\n' +
            '3. Third item\n' +
            'Subtasks:\n' +
            '- [JIRA-101] Dummy subtask 1 (Done)\n' +
            '- [JIRA-102] Dummy subtask 2 (In Progress)'
        }
      ]
    });
  });

  it('get-jira-issue handler handles no description and no subtasks', async () => {
    const mockGetIssue = jest.fn().mockResolvedValue({
      data: {
        key: 'JIRA-10',
        fields: {
          summary: 'No desc or subtasks',
          status: { name: 'To Do' },
          assignee: { displayName: 'Alice' },
        },
      },
    });
    MockedJiraClient.prototype.getIssue = mockGetIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const getIssueCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-jira-issue');
    const handler = getIssueCall[3];
    const result = await handler({ issueKey: 'JIRA-10' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-10\n' +
            'Summary: No desc or subtasks\n' +
            'Status: To Do\n' +
            'Assignee: Alice\n' +
            'URL: https://example.atlassian.net/browse/JIRA-10\n'
        }
      ]
    });
  });

  it('get-jira-issue handler handles plain string description', async () => {
    const mockGetIssue = jest.fn().mockResolvedValue({
      data: {
        key: 'JIRA-11',
        fields: {
          summary: 'Plain string desc',
          status: { name: 'To Do' },
          assignee: { displayName: 'Alice' },
          description: 'Just a plain string description.',
        },
      },
    });
    MockedJiraClient.prototype.getIssue = mockGetIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const getIssueCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-jira-issue');
    const handler = getIssueCall[3];
    const result = await handler({ issueKey: 'JIRA-11' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-11\n' +
            'Summary: Plain string desc\n' +
            'Status: To Do\n' +
            'Assignee: Alice\n' +
            'URL: https://example.atlassian.net/browse/JIRA-11\n' +
            'Description:\nJust a plain string description.\n'
        }
      ]
    });
  });

  it('search-jira-issues handler returns expected data', async () => {
    const mockSearchIssues = jest.fn().mockResolvedValue({
      data: {
        issues: [
          { key: 'JIRA-2', fields: { summary: 'Sum 2', status: { name: 'In Progress' }, assignee: { displayName: 'Bob' } } },
          { key: 'JIRA-3', fields: { summary: 'Sum 3', status: { name: 'Done' }, assignee: { displayName: 'Carol' } } },
        ],
      },
    });
    MockedJiraClient.prototype.searchIssues = mockSearchIssues;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'search-jira-issues');
    const handler = call[3];
    const result = await handler({ jql: 'project=TEST', maxResults: 2 }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-2\nSummary: Sum 2\nStatus: In Progress\nAssignee: Bob\nURL: https://example.atlassian.net/browse/JIRA-2\n' +
            '\n---\n' +
            'Key: JIRA-3\nSummary: Sum 3\nStatus: Done\nAssignee: Carol\nURL: https://example.atlassian.net/browse/JIRA-3\n'
        }
      ]
    });
    expect(mockSearchIssues).toHaveBeenCalledWith({ jql: 'project=TEST', maxResults: 2 });
  });

  it('search-jira-issues handler handles missing fields in issues', async () => {
    const mockSearchIssues = jest.fn().mockResolvedValue({
      data: {
        issues: [
          { key: 'JIRA-8', fields: {} },
          { key: 'JIRA-9', fields: { assignee: {} } },
        ],
      },
    });
    MockedJiraClient.prototype.searchIssues = mockSearchIssues;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'search-jira-issues');
    const handler = call[3];
    const result = await handler({ jql: 'project=TEST' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-8\nSummary: \nStatus: \nAssignee: Unassigned\nURL: https://example.atlassian.net/browse/JIRA-8\n' +
            '\n---\n' +
            'Key: JIRA-9\nSummary: \nStatus: \nAssignee: Unassigned\nURL: https://example.atlassian.net/browse/JIRA-9\n'
        }
      ]
    });
  });

  it('search-jira-issues handler returns empty array if no results', async () => {
    const mockSearchIssues = jest.fn().mockResolvedValue({ data: { issues: [] } });
    MockedJiraClient.prototype.searchIssues = mockSearchIssues;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'search-jira-issues');
    const handler = call[3];
    const result = await handler({ jql: 'project=NONE' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No issues found.'
        }
      ]
    });
  });

  it('create-jira-issue handler returns expected data', async () => {
    const mockCreateIssue = jest.fn().mockResolvedValue({
      data: { key: 'JIRA-4', fields: { summary: 'Created' } },
    });
    MockedJiraClient.prototype.createIssue = mockCreateIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'create-jira-issue');
    const handler = call[3];
    const result = await handler({ issueData: { fields: { summary: 'Created' } } }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Created issue: JIRA-4\nSummary: Created\nURL: https://example.atlassian.net/browse/JIRA-4'
        }
      ]
    });
    expect(mockCreateIssue).toHaveBeenCalledWith({ fields: { summary: 'Created' } });
  });

  it('update-jira-issue handler returns expected data', async () => {
    const mockUpdateIssue = jest.fn().mockResolvedValue({
      data: { key: 'JIRA-5', fields: { status: { name: 'updated' } } },
    });
    MockedJiraClient.prototype.updateIssue = mockUpdateIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'update-jira-issue');
    const handler = call[3];
    const result = await handler({ issueKey: 'JIRA-5', issueData: { fields: { status: { name: 'updated' } } } }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Updated issue: JIRA-5\nStatus: updated'
        }
      ]
    });
    expect(mockUpdateIssue).toHaveBeenCalledWith('JIRA-5', { fields: { status: { name: 'updated' } } });
  });

  it('update-jira-issue handler handles missing status', async () => {
    const mockUpdateIssue = jest.fn().mockResolvedValue({
      data: { key: 'JIRA-12', fields: {} },
    });
    MockedJiraClient.prototype.updateIssue = mockUpdateIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'update-jira-issue');
    const handler = call[3];
    const result = await handler({ issueKey: 'JIRA-12', issueData: {} }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Updated issue: JIRA-12\nStatus: updated'
        }
      ]
    });
  });

  it('get-jira-issue handler handles undefined description and subtasks', async () => {
    const mockGetIssue = jest.fn().mockResolvedValue({
      data: {
        key: 'JIRA-13',
        fields: {
          summary: 'No desc/subtasks',
          status: { name: 'To Do' },
          assignee: { displayName: 'Bob' },
          // description and subtasks are undefined
        },
      },
    });
    MockedJiraClient.prototype.getIssue = mockGetIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const getIssueCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-jira-issue');
    const handler = getIssueCall[3];
    const result = await handler({ issueKey: 'JIRA-13' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            'Key: JIRA-13\n' +
            'Summary: No desc/subtasks\n' +
            'Status: To Do\n' +
            'Assignee: Bob\n' +
            'URL: https://example.atlassian.net/browse/JIRA-13\n'
        }
      ]
    });
  });

  it('search-jira-issues handler handles undefined issues', async () => {
    const mockSearchIssues = jest.fn().mockResolvedValue({ data: {} });
    MockedJiraClient.prototype.searchIssues = mockSearchIssues;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'search-jira-issues');
    const handler = call[3];
    const result = await handler({ jql: 'project=NONE' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No issues found.'
        }
      ]
    });
  });

  it('delete-jira-issue handler returns expected data', async () => {
    const mockDeleteIssue = jest.fn().mockResolvedValue({});
    MockedJiraClient.prototype.deleteIssue = mockDeleteIssue;
    registerJiraTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'delete-jira-issue');
    const handler = call[3];
    const result = await handler({ issueKey: 'JIRA-6' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Deleted issue: JIRA-6'
        }
      ]
    });
    expect(mockDeleteIssue).toHaveBeenCalledWith('JIRA-6');
  });
});
