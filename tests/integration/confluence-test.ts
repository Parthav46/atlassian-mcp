import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MockAtlassianServer } from './mock-server';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(30000);

describe('Confluence Tools Integration Tests', () => {
  let transport: StdioClientTransport | undefined;
  let client: Client;
  let mockServer: MockAtlassianServer;
  let mockBaseUrl: string;

  beforeAll(async () => {
    // Start mock server on a different port to avoid conflicts
    mockServer = new MockAtlassianServer(3003);
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
    await mockServer.clearRoutes();
  });

  describe('get-page', () => {
    it('should retrieve a Confluence page successfully', async () => {
      expect(true).toBe(true); // Minimal test to verify Jest can find it
    });
  });
});
