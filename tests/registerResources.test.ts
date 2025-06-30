import { registerResources } from '../src/registerResources';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import * as jiraResources from '../src/resources/jira/registerJiraResources';
import * as confluenceResources from '../src/resources/confluence/registerConfluenceResources';

jest.mock('../src/resources/jira/registerJiraResources');
jest.mock('../src/resources/confluence/registerConfluenceResources');

describe('registerResources', () => {
  const mockServer = {} as unknown as McpServer;
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('calls all resource registration functions with config', () => {
    process.env.ATLASSIAN_BASE_URL = 'url';
    process.env.ATLASSIAN_API_TOKEN = 'token';
    process.env.ATLASSIAN_USERNAME = 'user';
    registerResources(mockServer);
    expect(jiraResources.registerJiraResources).toHaveBeenCalledWith(mockServer, expect.objectContaining({ baseUrl: 'url', token: 'token', username: 'user' }));
    expect(confluenceResources.registerConfluenceResources).toHaveBeenCalled();
  });

  it('parses CLI args if present', () => {
    const origArgv = process.argv;
    process.argv = ['node', 'script', '--base-url', 'cli-url', '--token', 'cli-token', '--username', 'cli-user'];
    registerResources(mockServer);
    expect(jiraResources.registerJiraResources).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({ baseUrl: 'cli-url', token: 'cli-token', username: 'cli-user' })
    );
    process.argv = origArgv;
  });

  it('fetches config from env if CLI argument not provided', () => {
    const origArgv = process.argv;
    process.argv = ['node', 'script'];
    process.env.ATLASSIAN_BASE_URL = 'env-url';
    process.env.ATLASSIAN_API_TOKEN = 'env-token';
    process.env.ATLASSIAN_USERNAME = 'env-user';
    registerResources(mockServer);
    expect(jiraResources.registerJiraResources).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({ baseUrl: 'env-url', token: 'env-token', username: 'env-user' })
    );
    process.argv = origArgv;
  });

  it('prefers CLI args over env vars', () => {
    const origArgv = process.argv;
    process.argv = ['node', 'script', '--base-url', 'cli-url', '--token', 'cli-token', '--username', 'cli-user'];
    process.env.ATLASSIAN_BASE_URL = 'env-url';
    process.env.ATLASSIAN_API_TOKEN = 'env-token';
    process.env.ATLASSIAN_USERNAME = 'env-user';
    registerResources(mockServer);
    expect(jiraResources.registerJiraResources).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({ baseUrl: 'cli-url', token: 'cli-token', username: 'cli-user' })
    );
    process.argv = origArgv;
  });
});