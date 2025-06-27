import { registerTools } from '../src/registerTools';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import * as pageTools from '../src/tools/confluence/registerPageTools';
import * as spaceTools from '../src/tools/confluence/registerSpaceTools';
import * as cqlTools from '../src/tools/confluence/registerCqlTools';
import * as jiraTools from '../src/tools/jira/registerJiraTools';

jest.mock('../src/tools/confluence/registerPageTools');
jest.mock('../src/tools/confluence/registerSpaceTools');
jest.mock('../src/tools/confluence/registerCqlTools');
jest.mock('../src/tools/jira/registerJiraTools');

describe('registerTools', () => {
  const mockServer = {} as unknown as McpServer;
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('calls all tool registration functions with config', () => {
    process.env.ATLASSIAN_BASE_URL = 'url';
    process.env.ATLASSIAN_API_TOKEN = 'token';
    process.env.ATLASSIAN_USERNAME = 'user';
    registerTools(mockServer);
    expect(pageTools.registerPageTools).toHaveBeenCalledWith(mockServer, expect.objectContaining({ baseUrl: 'url', token: 'token', username: 'user' }));
    expect(spaceTools.registerSpaceTools).toHaveBeenCalled();
    expect(cqlTools.registerCqlTools).toHaveBeenCalled();
    expect(jiraTools.registerJiraTools).toHaveBeenCalled();
  });

  it('parses CLI args if present', () => {
    const origArgv = process.argv;
    process.argv = ['node', 'script', '--base-url', 'cli-url', '--token', 'cli-token', '--username', 'cli-user'];
    registerTools(mockServer);
    expect(pageTools.registerPageTools).toHaveBeenCalledWith(
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
    registerTools(mockServer);
    expect(pageTools.registerPageTools).toHaveBeenCalledWith(
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
    registerTools(mockServer);
    expect(pageTools.registerPageTools).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({ baseUrl: 'cli-url', token: 'cli-token', username: 'cli-user' })
    );
    process.argv = origArgv;
  });

  it('defaults to empty string if neither CLI nor env provided', () => {
    const origArgv = process.argv;
    process.argv = ['node', 'script'];
    delete process.env.ATLASSIAN_BASE_URL;
    delete process.env.ATLASSIAN_API_TOKEN;
    delete process.env.ATLASSIAN_USERNAME;
    registerTools(mockServer);
    expect(pageTools.registerPageTools).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({ baseUrl: '', token: '', username: '' })
    );
    process.argv = origArgv;
  });
});
