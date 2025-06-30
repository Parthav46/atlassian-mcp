import { registerConfluenceResources } from '../../../src/resources/confluence/registerConfluenceResources';
import { ConfluenceClient } from '../../../src/clients/confluenceClient';
import type { AtlassianConfig } from '../../../src/clients/atlassianConfig';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

// Mock the ConfluenceClient
jest.mock('../../../src/clients/confluenceClient');
const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;

// Mock ResourceTemplate
jest.mock('@modelcontextprotocol/sdk/server/mcp', () => ({
  ResourceTemplate: jest.fn().mockImplementation(() => ({})),
}));

describe('registerConfluenceResources', () => {
  let server: jest.Mocked<McpServer>;
  let config: AtlassianConfig;

  beforeEach(() => {
    server = {
      resource: jest.fn(),
    } as unknown as jest.Mocked<McpServer>;
    
    config = {
      baseUrl: 'https://test.atlassian.net',
      token: 'test-token',
      username: 'test-user'
    };
    
    jest.clearAllMocks();
  });

  it('registers all confluence resources', () => {
    registerConfluenceResources(server, config);
    
    expect(server.resource).toHaveBeenCalledWith(
      'confluence-page',
      expect.any(Object),
      expect.objectContaining({
        description: expect.stringContaining('Get a Confluence page by ID'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
    
    expect(server.resource).toHaveBeenCalledWith(
      'confluence-page-children',
      expect.any(Object),
      expect.objectContaining({
        description: expect.stringContaining('Get children pages'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
    
    expect(server.resource).toHaveBeenCalledWith(
      'confluence-space',
      expect.any(Object),
      expect.objectContaining({
        description: expect.stringContaining('Get a Confluence space by ID'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
    
    expect(server.resource).toHaveBeenCalledWith(
      'confluence-folder',
      expect.any(Object),
      expect.objectContaining({
        description: expect.stringContaining('Get a Confluence folder by ID'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
    
    expect(server.resource).toHaveBeenCalledWith(
      'confluence-spaces',
      'confluence://spaces',
      expect.objectContaining({
        description: expect.stringContaining('List all Confluence spaces'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
    
    expect(server.resource).toHaveBeenCalledWith(
      'confluence-search',
      expect.any(Object),
      expect.objectContaining({
        description: expect.stringContaining('Advanced Confluence search'),
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
  });

  it('confluence-page resource handler gets page correctly', async () => {
    const mockGetPage = jest.fn().mockResolvedValue({
      data: {
        id: '123',
        title: 'Test Page',
        type: 'page',
        status: 'current',
        version: { number: 1 },
        body: {
          storage: {
            value: '<p>Test content</p>',
            representation: 'storage'
          }
        },
        _links: {
          webui: '/pages/123'
        }
      }
    });
    MockedConfluenceClient.prototype.getPage = mockGetPage;

    registerConfluenceResources(server, config);
    
    const resourceCall = server.resource.mock.calls.find(call => call[0] === 'confluence-page');
    expect(resourceCall).toBeDefined();
    const handler = resourceCall![3];
    
    const uri = new URL('confluence://page/123');
    const variables = { id: '123' };
    const extra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    const result = await handler(uri, variables, extra);
    
    expect(mockGetPage).toHaveBeenCalledWith({
      id: '123',
      'body-format': 'storage'
    });
    expect(result).toEqual({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: expect.stringContaining('"title": "Test Page"')
        }
      ]
    });
  });

  it('confluence-spaces resource handler lists spaces correctly', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({
      data: {
        results: [
          { id: '1', key: 'TEST', name: 'Test Space', type: 'global', status: 'current' },
          { id: '2', key: 'DEMO', name: 'Demo Space', type: 'global', status: 'current' }
        ]
      }
    });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;

    registerConfluenceResources(server, config);
    
    // Find the specific confluence-spaces resource call (fixed URI, not template)
    const resourceCall = server.resource.mock.calls.find(call => 
      call[0] === 'confluence-spaces' && typeof call[1] === 'string'
    );
    expect(resourceCall).toBeDefined();
    const handler = resourceCall![3]; // Fixed URI resource has handler as 4th parameter
    
    const uri = new URL('confluence://spaces');
    const extra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    
    // Cast to avoid TypeScript confusion about overloads
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const result = await (handler as any)(uri, extra);
    
    expect(mockListSpaces).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(result).toEqual({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: expect.stringContaining('"name": "Test Space"')
        }
      ]
    });
  });

  it('confluence-search resource handler searches correctly', async () => {
    const mockSearchWithCql = jest.fn().mockResolvedValue({
      data: {
        results: [
          {
            id: '123',
            title: 'Search Result',
            type: 'page',
            status: 'current',
            _links: { webui: '/pages/123' }
          }
        ]
      }
    });
    MockedConfluenceClient.prototype.searchWithCql = mockSearchWithCql;

    registerConfluenceResources(server, config);
    
    const resourceCall = server.resource.mock.calls.find(call => call[0] === 'confluence-search');
    expect(resourceCall).toBeDefined();
    const handler = resourceCall![3];
    
    const uri = new URL('confluence://search/type%3Dpage');
    const variables = { cql: 'type=page' };
    const extra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    const result = await handler(uri, variables, extra);
    
    expect(mockSearchWithCql).toHaveBeenCalledWith('type=page', undefined, undefined);
    expect(result).toEqual({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: expect.stringContaining('"searchQuery": "type=page"')
        }
      ]
    });
  });

  it('resource handlers throw errors for missing required parameters', async () => {
    registerConfluenceResources(server, config);
    
    // Test confluence-page handler
    const pageResourceCall = server.resource.mock.calls.find(call => call[0] === 'confluence-page');
    const pageHandler = pageResourceCall![3];
    
    const uri = new URL('confluence://page/');
    const variables = {};
    const extra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',  
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    
    await expect(pageHandler(uri, variables, extra)).rejects.toThrow('Page ID is required');
    
    // Test confluence-search handler
    const searchResourceCall = server.resource.mock.calls.find(call => call[0] === 'confluence-search');
    const searchHandler = searchResourceCall![3];
    
    const searchUri = new URL('confluence://search/');
    const searchVariables = {};
    const searchExtra = {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: jest.fn(),
      sendRequest: jest.fn()
    };
    
    await expect(searchHandler(searchUri, searchVariables, searchExtra)).rejects.toThrow('CQL query is required');
  });
});