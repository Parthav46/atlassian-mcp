// Integration test for MCP server health endpoint over stdio
import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

jest.setTimeout(15000);

describe('MCP Server Integration (stdio)', () => {
  let transport: StdioClientTransport | undefined;

  afterEach(async () => {
    if (transport && typeof transport.close === 'function') {
      await transport.close();
    }
    transport = undefined;
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
});
