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
    mockBaseUrl = await mockServer.clearRoutes();
  });

  describe('get-page', () => {
    it('should retrieve a Confluence page successfully', async () => {
      const mockPage = {
        id: '12345',
        status: 'current',
        title: 'Test Page',
        body: {
          storage: {
            value: '<p>This is a test page content</p>',
            representation: 'storage'
          }
        },
        version: {
          number: 1,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        _links: {
          webui: '/spaces/TEST/pages/12345/Test+Page'
        }
      };

      mockServer.mockConfluencePage('12345', mockPage);

      const result = await client.callTool({
        name: 'get-page',
        arguments: { pageId: 12345 }
      });

      expect((result as any).content[0].text).toContain('Title: Test Page');
      expect((result as any).content[0].text).toContain('URL: ' + mockBaseUrl + '/wiki/spaces/TEST/pages/12345/Test+Page');
      expect((result as any).content[0].text).toContain('<p>This is a test page content</p>');
    });

    it('should handle page not found error', async () => {
      mockServer.mockConfluencePage('99999', { 
        message: 'Page not found',
        statusCode: 404 
      }, 404);

      const result = await client.callTool({
        name: 'get-page',
        arguments: { pageId: 99999 }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 404');
    });
  });

  describe('get-children', () => {
    it('should retrieve children of a page successfully', async () => {
      const mockChildren = {
        results: [
          {
            id: '12346',
            title: 'Child Page 1',
            status: 'current',
            _links: {
              webui: '/spaces/TEST/pages/12346/Child+Page+1'
            }
          },
          {
            id: '12347',
            title: 'Child Page 2',
            status: 'current',
            _links: {
              webui: '/spaces/TEST/pages/12347/Child+Page+2'
            }
          }
        ],
        size: 2,
        _links: {}
      };

      mockServer.mockConfluenceChildren('12345', mockChildren);

      const result = await client.callTool({
        name: 'get-children',
        arguments: { pageId: 12345 }
      });

      expect((result as any).content[0].text).toContain('Children:');
      expect((result as any).content[0].text).toContain('Child Page 1');
      expect((result as any).content[0].text).toContain('Child Page 2');
    });

    it('should handle page with no children', async () => {
      const mockChildren = {
        results: [],
        size: 0,
        _links: {}
      };

      mockServer.mockConfluenceChildren('12345', mockChildren);

      const result = await client.callTool({
        name: 'get-children',
        arguments: { pageId: 12345 }
      });

      expect((result as any).content[0].text).toContain('No children found');
    });
  });

  describe('list-spaces', () => {
    it('should list Confluence spaces successfully', async () => {
      const mockSpaces = {
        results: [
          {
            id: '1001',
            key: 'TEST',
            name: 'Test Space',
            type: 'global',
            status: 'current',
            _links: {
              webui: '/spaces/TEST'
            }
          },
          {
            id: '1002',
            key: 'DOC',
            name: 'Documentation Space',
            type: 'global',
            status: 'current',
            _links: {
              webui: '/spaces/DOC'
            }
          }
        ],
        size: 2,
        _links: {}
      };

      mockServer.mockConfluenceSpaces(mockSpaces);

      const result = await client.callTool({
        name: 'list-spaces',
        arguments: {}
      });

      expect((result as any).content[0].text).toContain('Spaces:');
      expect((result as any).content[0].text).toContain('Test Space (KEY: TEST, ID: 1001)');
      expect((result as any).content[0].text).toContain('Documentation Space (KEY: DOC, ID: 1002)');
    });

    it('should filter spaces by keys', async () => {
      const mockSpaces = {
        results: [
          {
            id: '1001',
            key: 'TEST',
            name: 'Test Space',
            type: 'global',
            status: 'current',
            _links: {
              webui: '/spaces/TEST'
            }
          }
        ],
        size: 1,
        _links: {}
      };

      mockServer.mockConfluenceSpaces(mockSpaces);

      const result = await client.callTool({
        name: 'list-spaces',
        arguments: { keys: 'TEST' }
      });

      expect((result as any).content[0].text).toContain('Spaces:');
      expect((result as any).content[0].text).toContain('Test Space (KEY: TEST, ID: 1001)');
    });
  });

  describe('get-space', () => {
    it('should retrieve a space by ID successfully', async () => {
      const mockSpace = {
        id: '1001',
        key: 'TEST',
        name: 'Test Space',
        type: 'global',
        status: 'current',
        description: {
          plain: {
            value: 'This is a test space for development',
            representation: 'plain'
          }
        },
        _links: {
          webui: '/spaces/TEST'
        }
      };

      mockServer.mockConfluenceSpace('1001', mockSpace);

      const result = await client.callTool({
        name: 'get-space',
        arguments: { spaceId: 1001 }
      });

      expect((result as any).content[0].text).toContain('ID: 1001');
      expect((result as any).content[0].text).toContain('Key: TEST');
      expect((result as any).content[0].text).toContain('Space: Test Space');
      expect((result as any).content[0].text).toContain('Description: This is a test space for development');
    });

    it('should handle space not found error', async () => {
      mockServer.mockConfluenceSpace('99999', {
        message: 'Space not found',
        statusCode: 404
      }, 404);

      const result = await client.callTool({
        name: 'get-space',
        arguments: { spaceId: 99999 }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 404');
    });
  });

  describe('create-page', () => {
    it('should create a new page successfully', async () => {
      // Mock the space lookup first
      const mockSpaceResponse = {
        results: [{
          id: '1001',
          key: 'TEST',
          name: 'Test Space'
        }],
        size: 1
      };
      
      mockServer.mockConfluenceSpaces(mockSpaceResponse);

      const mockCreatedPage = {
        id: '12348',
        status: 'current',
        title: 'New Test Page',
        version: {
          number: 1,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        _links: {
          webui: '/spaces/TEST/pages/12348/New+Test+Page'
        }
      };

      mockServer.mockConfluenceCreatePage(mockCreatedPage, 201);

      const result = await client.callTool({
        name: 'create-page',
        arguments: {
          spaceKey: 'TEST',
          title: 'New Test Page',
          body: '<p>This is the content of the new page</p>'
        }
      });

      expect((result as any).content[0].text).toContain('Created page: New Test Page');
      expect((result as any).content[0].text).toContain(mockBaseUrl + '/wiki/spaces/TEST/pages/12348/New+Test+Page');
    });

    it('should handle creation errors', async () => {
      // Mock the space lookup first
      const mockSpaceResponse = {
        results: [{
          id: '1001',
          key: 'TEST',
          name: 'Test Space'
        }],
        size: 1
      };
      
      mockServer.mockConfluenceSpaces(mockSpaceResponse);
      
      mockServer.mockConfluenceCreatePage({
        message: 'Space not found',
        statusCode: 400
      }, 400);

      const result = await client.callTool({
        name: 'create-page',
        arguments: {
          spaceKey: 'TEST',
          title: 'New Test Page',
          body: '<p>Content</p>'
        }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 400');
    });
  });

  describe('update-page', () => {
    it('should update a page successfully', async () => {
      const mockUpdatedPage = {
        id: '12345',
        status: 'current',
        title: 'Updated Test Page',
        version: {
          number: 2,
          createdAt: '2023-01-02T00:00:00.000Z'
        },
        _links: {
          webui: '/spaces/TEST/pages/12345/Updated+Test+Page'
        }
      };

      mockServer.mockConfluenceUpdatePage('12345', mockUpdatedPage);

      const result = await client.callTool({
        name: 'update-page',
        arguments: {
          pageId: 12345,
          title: 'Updated Test Page',
          body: '<p>Updated content</p>',
          version: 2
        }
      });

      expect((result as any).content[0].text).toContain('Updated page: Updated Test Page');
      expect((result as any).content[0].text).toContain('ID: 12345');
      expect((result as any).content[0].text).toContain('Status: current');
    });

    it('should handle update errors', async () => {
      mockServer.mockConfluenceUpdatePage('12345', {
        message: 'Version conflict',
        statusCode: 409
      }, 409);

      const result = await client.callTool({
        name: 'update-page',
        arguments: {
          pageId: 12345,
          title: 'Test Page',
          body: '<p>Content</p>',
          version: 1
        }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 409');
    });
  });

  describe('delete-page', () => {
    it('should delete a page successfully', async () => {
      mockServer.mockConfluenceDeletePage('12345');

      const result = await client.callTool({
        name: 'delete-page',
        arguments: { pageId: 12345 }
      });

      expect((result as any).content[0].text).toContain('Deleted page: 12345');
    });

    it('should handle deletion errors', async () => {
      mockServer.mockConfluenceDeletePage('12345', 403);

      const result = await client.callTool({
        name: 'delete-page',
        arguments: { pageId: 12345 }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 403');
    });
  });

  describe('confluence-search', () => {
    it('should search content successfully', async () => {
      const mockSearchResults = {
        results: [
          {
            content: {
              id: '12345',
              title: 'Search Result Page',
              type: 'page',
              _links: {
                webui: '/spaces/TEST/pages/12345/Search+Result+Page'
              }
            },
            title: 'Search Result Page',
            excerpt: 'This page contains the search term...',
            url: '/spaces/TEST/pages/12345/Search+Result+Page'
          }
        ],
        size: 1,
        totalSize: 1,
        _links: {}
      };

      mockServer.mockConfluenceSearch(mockSearchResults);

      const result = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'text ~ "test"' }
      });

      expect((result as any).content[0].text).toContain('Search Results:');
      expect((result as any).content[0].text).toContain('Search Result Page');
      expect((result as any).content[0].text).toContain('This page contains the search term');
    });

    it('should handle empty search results', async () => {
      const mockSearchResults = {
        results: [],
        size: 0,
        totalSize: 0,
        _links: {}
      };

      mockServer.mockConfluenceSearch(mockSearchResults);

      const result = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'text ~ "nonexistent"' }
      });

      expect((result as any).content[0].text).toContain('No results found');
    });
  });

  describe('get-folder', () => {
    it('should retrieve a folder successfully', async () => {
      const mockFolder = {
        id: '5001',
        title: 'Test Folder',
        _links: {
          webui: '/spaces/TEST/folders/5001'
        }
      };

      mockServer.mockConfluenceFolder('5001', mockFolder);

      const result = await client.callTool({
        name: 'get-folder',
        arguments: { folderId: 5001 }
      });

      expect((result as any).content[0].text).toContain('ID: 5001');
      expect((result as any).content[0].text).toContain('Folder: Test Folder');
      expect((result as any).content[0].text).toContain('URL: ' + mockBaseUrl + '/spaces/TEST/folders/5001');
    });

    it('should handle folder not found error', async () => {
      mockServer.mockConfluenceFolder('99999', {
        message: 'Folder not found',
        statusCode: 404
      }, 404);

      const result = await client.callTool({
        name: 'get-folder',
        arguments: { folderId: 99999 }
      });

      expect((result as any).content[0].text).toContain('Request failed with status code 404');
    });
  });
});
