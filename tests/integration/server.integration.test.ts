// Integration test for MCP server health endpoint over stdio
import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MockAtlassianServer } from './mock-server';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(15000);

describe('MCP Server Integration (stdio)', () => {
  let transport: StdioClientTransport | undefined;
  let mockServer: MockAtlassianServer;

  afterEach(async () => {
    if (transport && typeof transport.close === 'function') {
      await transport.close();
    }
    transport = undefined;
    if (mockServer) {
      await mockServer.stop();
    }
  });

  it('responds to health request', async () => {
    const serverPath = path.join(__dirname, '../../dist/src/index.js');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: { ...process.env, MCP_HEALTH_ENABLED: '1' }
    });
    const client = new Client({
      name: 'integration-test-client',
      version: '1.0.0'
    });
    await client.connect(transport);
    const result = await client.callTool({ name: 'health', arguments: {} });
    expect(result).toMatchObject({
      content: [
        {
          type: 'text',
          text: 'ok'
        }
      ]
    });
    // Explicitly close transport after test
    await transport.close();
    transport = undefined;
  });

  it('should start server with mock credentials and list tools', async () => {
    const serverPath = path.join(__dirname, '../../dist/src/index.js');
    transport = new StdioClientTransport({
      command: 'node',
      args: [
        serverPath,
        '--base-url', 'https://test.atlassian.net',
        '--token', 'mock-token',
        '--username', 'test@example.com'
      ]
    });
    const client = new Client({
      name: 'integration-test-client',
      version: '1.0.0'
    });
    await client.connect(transport);
    
    // List available tools
    const tools = await client.listTools();
    expect(tools.tools).toBeDefined();
    expect(tools.tools.length).toBeGreaterThan(0);
    
    // Check for specific expected tools
    const toolNames = tools.tools.map(tool => tool.name);
    expect(toolNames).toContain('get-jira-issue');
    expect(toolNames).toContain('search-jira-issues');
    expect(toolNames).toContain('get-page');
    expect(toolNames).toContain('confluence_search');
    expect(toolNames).toContain('list-spaces');
    
    await transport.close();
    transport = undefined;
  });

  it('should handle tool calls with network errors gracefully', async () => {
    // Start mock server
    mockServer = new MockAtlassianServer(3006);
    const mockBaseUrl = await mockServer.start();
    
    // Mock network failure using 500 error
    mockServer.mockJiraIssue('NETWORK-ERROR', {}, 500);

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
    const client = new Client({
      name: 'integration-test-client',
      version: '1.0.0'
    });
    await client.connect(transport);
    
    const result = await client.callTool({
      name: 'get-jira-issue',
      arguments: { issueKey: 'NETWORK-ERROR' }
    });
    
    // Should return error message instead of throwing
    expect((result as any).content[0].text).toContain('Request failed with status code 500');
    
    await transport.close();
    transport = undefined;
  });
});
