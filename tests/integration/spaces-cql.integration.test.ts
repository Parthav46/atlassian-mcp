import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MockAtlassianServer } from './mock-server';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(30000);

describe('Confluence Space and CQL Integration Tests', () => {
  let transport: StdioClientTransport | undefined;
  let client: Client;
  let mockServer: MockAtlassianServer;
  let mockBaseUrl: string;

  beforeAll(async () => {
    mockServer = new MockAtlassianServer(3004);
    mockBaseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(async () => {
    mockBaseUrl = await mockServer.clearRoutes();
    
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
  });

  describe('list-spaces', () => {
    it('should list all spaces successfully', async () => {
      const mockSpaces = {
        results: [
          {
            id: '12345',
            key: 'TEST',
            name: 'Test Space',
            type: 'global',
            status: 'current'
          },
          {
            id: '12346',
            key: 'DOCS',
            name: 'Documentation Space',
            type: 'global',
            status: 'current'
          }
        ],
        _links: {}
      };

      mockServer.mockConfluenceSpaces(mockSpaces);

      const result = await client.callTool({
        name: 'list-spaces',
        arguments: {}
      });

      expect((result as any).content[0].text).toContain('Test Space (KEY: TEST, ID: 12345)');
      expect((result as any).content[0].text).toContain('Documentation Space (KEY: DOCS, ID: 12346)');
      expect((result as any).content[0].text).toContain('ID: 12345');
      expect((result as any).content[0].text).toContain('ID: 12346');
    });

    it('should filter spaces by keys', async () => {
      const mockSpaces = {
        results: [
          {
            id: '12345',
            key: 'TEST',
            name: 'Test Space',
            type: 'global',
            status: 'current'
          }
        ],
        _links: {}
      };

      mockServer.mockConfluenceSpaces(mockSpaces);

      const result = await client.callTool({
        name: 'list-spaces',
        arguments: { keys: 'TEST' }
      });

      expect((result as any).content[0].text).toContain('Test Space (KEY: TEST, ID: 12345)');
      expect((result as any).content[0].text).not.toContain('DOCS');
    });

    it('should handle pagination parameters', async () => {
      const mockSpaces = {
        results: [
          {
            id: '12345',
            key: 'TEST',
            name: 'Test Space',
            type: 'global',
            status: 'current'
          }
        ],
        _links: {
          next: '/wiki/api/v2/spaces?cursor=next-cursor'
        }
      };

      mockServer.mockConfluenceSpaces(mockSpaces);

      const result = await client.callTool({
        name: 'list-spaces',
        arguments: { limit: 1, start: 0 }
      });

      expect((result as any).content[0].text).toContain('Test Space (KEY: TEST, ID: 12345)');
    });

    it('should handle empty spaces list', async () => {
      const mockSpaces = {
        results: [],
        _links: {}
      };

      mockServer.mockConfluenceSpaces(mockSpaces);

      const result = await client.callTool({
        name: 'list-spaces',
        arguments: {}
      });

      expect((result as any).content[0].text).toContain('No spaces found');
    });
  });

  describe('get-space', () => {
    it('should retrieve space details successfully', async () => {
      const mockSpace = {
        id: '12345',
        key: 'TEST',
        name: 'Test Space',
        type: 'global',
        status: 'current',
        description: {
          plain: {
            value: 'This is a test space'
          }
        },
        _links: {
          webui: '/spaces/TEST'
        }
      };

      mockServer.mockConfluenceSpace('12345', mockSpace);

      const result = await client.callTool({
        name: 'get-space',
        arguments: { spaceId: 12345 }
      });

      expect((result as any).content[0].text).toContain('Key: TEST');
      expect((result as any).content[0].text).toContain('Space: Test Space');
      expect((result as any).content[0].text).toContain('This is a test space');
    });

    it('should handle space not found error', async () => {
      mockServer.mockConfluenceSpace('99999', { message: 'Space not found' }, 404);

      const result = await client.callTool({
        name: 'get-space',
        arguments: { spaceId: 99999 }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 404');
    });
  });

  describe('get-folder', () => {
    it('should retrieve folder details successfully', async () => {
      const mockFolder = {
        id: '56789',
        title: 'Test Folder',
        type: 'folder'
      };

      mockServer.mockConfluenceFolder('56789', mockFolder);

      const result = await client.callTool({
        name: 'get-folder',
        arguments: { folderId: 56789 }
      });

      expect((result as any).content[0].text).toContain('Test Folder');
    });

    it('should handle folder not found error', async () => {
      mockServer.mockConfluenceFolder('99999', { message: 'Folder not found' }, 404);

      const result = await client.callTool({
        name: 'get-folder',
        arguments: { folderId: 99999 }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 404');
    });
  });

  describe('confluence_search (CQL)', () => {
    it('should perform CQL search successfully', async () => {
      const mockSearchResults = {
        results: [
          {
            title: 'Search Result 1',
            excerpt: 'This is the first search result',
            url: '/wiki/spaces/TEST/pages/123456',
            lastModified: '2024-01-01T10:00:00.000Z'
          },
          {
            title: 'Search Result 2',
            excerpt: 'This is the second search result',
            url: '/wiki/spaces/TEST/pages/789012',
            lastModified: '2024-01-02T10:00:00.000Z'
          }
        ],
        totalSize: 2,
        cqlQuery: 'space = TEST',
        searchDuration: 50
      };

      mockServer.mockConfluenceSearch(mockSearchResults);

      const result = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'space = TEST' }
      });

      expect((result as any).content[0].text).toContain('Search Result 1');
      expect((result as any).content[0].text).toContain('Search Result 2');
      expect((result as any).content[0].text).toContain('This is the first search result');
    });

    it('should handle search with pagination', async () => {
      const mockSearchResults = {
        results: [
          {
            title: 'Paginated Result',
            excerpt: 'This is a paginated result',
            url: '/wiki/spaces/TEST/pages/111111',
            lastModified: '2024-01-01T10:00:00.000Z'
          }
        ],
        totalSize: 50,
        cqlQuery: 'space = TEST',
        searchDuration: 25,
        _links: {
          next: '/wiki/rest/api/search?cql=space%20%3D%20TEST&start=10&limit=10'
        }
      };

      mockServer.mockConfluenceSearch(mockSearchResults);

      const result = await client.callTool({
        name: 'confluence_search',
        arguments: { 
          cql: 'space = TEST',
          limit: 10,
          start: 0
        }
      });

      expect((result as any).content[0].text).toContain('Paginated Result');
    });

    it('should handle empty search results', async () => {
      const mockSearchResults = {
        results: [],
        totalSize: 0,
        cqlQuery: 'space = EMPTY',
        searchDuration: 10
      };

      mockServer.mockConfluenceSearch(mockSearchResults);

      const result = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'space = EMPTY' }
      });

      expect((result as any).content[0].text).toContain('No results found');
    });

    it('should handle invalid CQL queries', async () => {
      mockServer.mockConfluenceSearch({ 
        message: 'Invalid CQL query'
      }, 400);

      const result = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'invalid query syntax' }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 400');
    });

    it('should handle complex CQL search with multiple criteria', async () => {
      const mockSearchResults = {
        results: [
          {
            title: 'Complex Search Result',
            excerpt: 'Result matching complex criteria',
            url: '/wiki/spaces/TEST/pages/999999',
            lastModified: '2024-01-15T10:00:00.000Z'
          }
        ],
        totalSize: 1,
        cqlQuery: 'space = TEST AND type = page AND title ~ "complex"',
        searchDuration: 75
      };

      mockServer.mockConfluenceSearch(mockSearchResults);

      const result = await client.callTool({
        name: 'confluence_search',
        arguments: { 
          cql: 'space = TEST AND type = page AND title ~ "complex"'
        }
      });

      expect((result as any).content[0].text).toContain('Complex Search Result');
      expect((result as any).content[0].text).toContain('Result matching complex criteria');
    });
  });
});
