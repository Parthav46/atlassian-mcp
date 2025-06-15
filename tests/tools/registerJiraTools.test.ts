import { registerJiraTools } from '../../src/tools/registerJiraTools';
import { JiraClient } from '../../src/clients/jiraClient';

jest.mock('../../src/clients/jiraClient');
const MockedJiraClient = JiraClient as jest.MockedClass<typeof JiraClient>;

describe('registerJiraTools', () => {
  let server: any;
  let config: any;

  beforeEach(() => {
    server = { tool: jest.fn() };
    config = { baseUrl: 'https://example.atlassian.net' };
    MockedJiraClient.mockClear();
  });

  it('registers all expected tools', () => {
    registerJiraTools(server, config);
    expect(server.tool).toHaveBeenCalledTimes(5);
    const toolNames = server.tool.mock.calls.map((call: any[]) => call[0]);
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
    registerJiraTools(server, config);
    const getIssueCall = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-jira-issue');
    expect(getIssueCall).toBeDefined();
    const handler = getIssueCall[3];
    const result = await handler({ issueKey: 'JIRA-1' }, {});
    expect(result).toEqual({
      key: 'JIRA-1',
      summary: 'Test summary',
      status: 'To Do',
      assignee: 'Alice',
      url: 'https://example.atlassian.net/browse/JIRA-1',
      description: 'desc',
    });
    expect(mockGetIssue).toHaveBeenCalledWith('JIRA-1');
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
    registerJiraTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'search-jira-issues');
    const handler = call[3];
    const result = await handler({ jql: 'project=TEST', startAt: 0, maxResults: 2 }, {});
    expect(result).toEqual({
      issues: [
        { key: 'JIRA-2', summary: 'Sum 2', status: 'In Progress', assignee: 'Bob', url: 'https://example.atlassian.net/browse/JIRA-2' },
        { key: 'JIRA-3', summary: 'Sum 3', status: 'Done', assignee: 'Carol', url: 'https://example.atlassian.net/browse/JIRA-3' },
      ],
    });
    expect(mockSearchIssues).toHaveBeenCalledWith('project=TEST', 0, 2);
  });

  it('search-jira-issues handler returns empty array if no results', async () => {
    const mockSearchIssues = jest.fn().mockResolvedValue({ data: { issues: [] } });
    MockedJiraClient.prototype.searchIssues = mockSearchIssues;
    registerJiraTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'search-jira-issues');
    const handler = call[3];
    const result = await handler({ jql: 'project=NONE' }, {});
    expect(result).toEqual({ issues: [] });
  });

  it('create-jira-issue handler returns expected data', async () => {
    const mockCreateIssue = jest.fn().mockResolvedValue({
      data: { key: 'JIRA-4', fields: { summary: 'Created' } },
    });
    MockedJiraClient.prototype.createIssue = mockCreateIssue;
    registerJiraTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'create-jira-issue');
    const handler = call[3];
    const result = await handler({ issueData: { fields: { summary: 'Created' } } }, {});
    expect(result).toEqual({ key: 'JIRA-4', url: 'https://example.atlassian.net/browse/JIRA-4', summary: 'Created' });
    expect(mockCreateIssue).toHaveBeenCalledWith({ fields: { summary: 'Created' } });
  });

  it('update-jira-issue handler returns expected data', async () => {
    const mockUpdateIssue = jest.fn().mockResolvedValue({
      data: { key: 'JIRA-5', fields: { status: { name: 'updated' } } },
    });
    MockedJiraClient.prototype.updateIssue = mockUpdateIssue;
    registerJiraTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'update-jira-issue');
    const handler = call[3];
    const result = await handler({ issueKey: 'JIRA-5', issueData: { fields: { status: { name: 'updated' } } } }, {});
    expect(result).toEqual({ key: 'JIRA-5', status: 'updated' });
    expect(mockUpdateIssue).toHaveBeenCalledWith('JIRA-5', { fields: { status: { name: 'updated' } } });
  });

  it('delete-jira-issue handler returns expected data', async () => {
    const mockDeleteIssue = jest.fn().mockResolvedValue({});
    MockedJiraClient.prototype.deleteIssue = mockDeleteIssue;
    registerJiraTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'delete-jira-issue');
    const handler = call[3];
    const result = await handler({ issueKey: 'JIRA-6' }, {});
    expect(result).toEqual({ key: 'JIRA-6', status: 'deleted' });
    expect(mockDeleteIssue).toHaveBeenCalledWith('JIRA-6');
  });
});
