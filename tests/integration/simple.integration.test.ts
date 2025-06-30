import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MockAtlassianServer } from './mock-server';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(30000);

describe('Simple Jira Integration Test with Mock Server', () => {
  let transport: StdioClientTransport | undefined;
  let client: Client;
  let mockServer: MockAtlassianServer;
  let mockBaseUrl: string;

  beforeAll(async () => {
    // Start mock server
    mockServer = new MockAtlassianServer(3001);
    mockBaseUrl = await mockServer.start();
  });

  afterAll(async () => {
    // Stop mock server
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
    if (client) {
      await client.close();
    }
    if (transport) {
      await transport.close();
      transport = undefined;
    }
  });

  it('should mock Jira API calls correctly', async () => {
    // Setup mock data
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

    // Setup mock endpoint
    mockServer.mockJiraIssue('TEST-123', mockIssue);

    const result = await client.callTool({
      name: 'get-jira-issue',
      arguments: { issueKey: 'TEST-123' }
    });

    expect((result as any).content[0].text).toContain('Key: TEST-123');
    expect((result as any).content[0].text).toContain('Summary: Test Issue Summary');
    expect((result as any).content[0].text).toContain('Status: In Progress');
    expect((result as any).content[0].text).toContain('Assignee: John Doe');
  });
});
