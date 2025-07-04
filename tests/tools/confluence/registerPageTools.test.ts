import { registerPageTools } from '../../../src/tools/confluence/registerPageTools';
import { ConfluenceClient } from '../../../src/clients/confluenceClient';
import { AtlassianConfig } from '../../../src/clients/atlassianConfig';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

jest.mock('../../../src/clients/confluenceClient');
const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;

describe('registerPageTools', () => {
  let server: { tool: jest.Mock };
  let config: AtlassianConfig;

  beforeEach(() => {
    server = { tool: jest.fn() };
    config = {
      baseUrl: 'https://example.atlassian.net',
      token: 'dummy-token',
      username: 'dummy-user'
    };
    MockedConfluenceClient.mockClear();
  });

  it('registers all expected tools', () => {
    registerPageTools(server as unknown as McpServer, config);
    // Should register 5 tools
    expect(server.tool).toHaveBeenCalledTimes(5);
    const toolNames = server.tool.mock.calls.map((call: unknown[]) => call[0]);
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'get-page',
        'update-page',
        'get-children',
        'create-page',
        'delete-page',
      ])
    );
  });

  it('get-page handler returns expected data', async () => {
    const mockGetPage = jest.fn().mockResolvedValue({
      data: {
        id: '123',
        title: 'Test Page',
        body: { storage: { value: '<p>Test</p>' }, atlas_doc_format: { value: 'markdown' } },
      },
    });
    MockedConfluenceClient.prototype.getPage = mockGetPage;
    registerPageTools(server as unknown as McpServer, config);
    const getPageCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-page');
    expect(getPageCall).toBeDefined();
    const handler = getPageCall[3];
    const result = await handler({ pageId: '123' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Title: Test Page\nURL: No link available\n\n<p>Test</p>'
        }
      ]
    });
    expect(mockGetPage).toHaveBeenCalledWith({ id: '123', 'body-format': 'storage' });
  });

  it('get-page handler returns markdown content if bodyFormat is markdown', async () => {
    const mockGetPage = jest.fn().mockResolvedValue({
      data: {
        id: '123',
        title: 'Test Page',
        body: { atlas_doc_format: { value: '# Markdown' } },
      },
    });
    MockedConfluenceClient.prototype.getPage = mockGetPage;
    registerPageTools(server as unknown as McpServer, config);
    const getPageCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-page');
    const handler = getPageCall[3];
    const result = await handler({ pageId: '123', bodyFormat: 'markdown' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Title: Test Page\nURL: No link available\n\n# Markdown'
        }
      ]
    });
    expect(mockGetPage).toHaveBeenCalledWith({ id: '123', 'body-format': 'atlas_doc_format' });
  });

  it('get-page handler handles missing body gracefully', async () => {
    const mockGetPage = jest.fn().mockResolvedValue({
      data: {
        id: '124',
        title: 'No Body',
        body: {},
      },
    });
    MockedConfluenceClient.prototype.getPage = mockGetPage;
    registerPageTools(server as unknown as McpServer, config);
    const getPageCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-page');
    const handler = getPageCall[3];
    const resultStorage = await handler({ pageId: '124', bodyFormat: 'storage' }, {});
    expect(resultStorage).toEqual({
      content: [
        {
          type: 'text',
          text: 'Title: No Body\nURL: No link available\n\n'
        }
      ]
    });
    const resultMarkdown = await handler({ pageId: '124', bodyFormat: 'markdown' }, {});
    expect(resultMarkdown).toEqual({
      content: [
        {
          type: 'text',
          text: 'Title: No Body\nURL: No link available\n\n'
        }
      ]
    });
  });

  it('update-page handler returns expected data', async () => {
    const mockUpdatePage = jest.fn().mockResolvedValue({
      data: { id: '123', title: 'Updated Title', status: 'current' },
    });
    MockedConfluenceClient.prototype.updatePage = mockUpdatePage;
    registerPageTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call) => call[0] === 'update-page');
    const handler = call[3];
    const result = await handler({ pageId: 123, title: 'Updated Title', body: '<p>Updated</p>', version: 2 }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Updated page: Updated Title (ID: 123) Status: current'
        }
      ]
    });
    expect(mockUpdatePage).toHaveBeenCalledWith(123, {
      id: '123',
      title: 'Updated Title',
      body: {
        representation: 'storage',
        value: '<p>Updated</p>'
      },
      version: {
        number: 2
      },
      status: 'current'
    });
  });

  it('get-children handler returns children', async () => {
    const mockGetChildren = jest.fn().mockResolvedValue({
      data: { results: [
        { id: 'c1', title: 'Child 1', spaceId: 'S1' },
        { id: 'c2', title: 'Child 2', spaceId: 'S2' },
      ] },
    });
    MockedConfluenceClient.prototype.getChildren = mockGetChildren;
    registerPageTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-children');
    const handler = call[3];
    const result = await handler({ pageId: 'parent' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Children:\n- Child 1: https://example.atlassian.net/wiki/spaces/S1/pages/c1\n- Child 2: https://example.atlassian.net/wiki/spaces/S2/pages/c2'
        }
      ]
    });
    expect(mockGetChildren).toHaveBeenCalledWith('parent');
  });

  it('get-children handler returns empty array if no children', async () => {
    const mockGetChildren = jest.fn().mockResolvedValue({ data: { results: [] } });
    MockedConfluenceClient.prototype.getChildren = mockGetChildren;
    registerPageTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-children');
    const handler = call[3];
    const result = await handler({ pageId: 'parent' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No children found.'
        }
      ]
    });
  });

  it('create-page handler breaks flow if space not found', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({
      data: { results: [] },
    });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    registerPageTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'create-page');
    const handler = call[3];
    const result = await handler({ spaceKey: 'SPACE1', title: 'New Page', body: '<p>Body</p>' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Space with key "SPACE1" not found.'
        }
      ]
    });
    expect(mockListSpaces).toHaveBeenCalledWith(undefined, 1, 'SPACE1');
    expect(MockedConfluenceClient.prototype.createPage).not.toHaveBeenCalled();
  });

  it('create-page handler returns expected data', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({
      data: { results: [{ id: 123, key: 'SPACE1', name: 'Space 1' }] },
    });
    const mockCreatePage = jest.fn().mockResolvedValue({
      status: 201,
      data: { id: 'new1', title: 'New Page', _links: { webui: '/pages/new1' } },
    });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    MockedConfluenceClient.prototype.createPage = mockCreatePage;
    registerPageTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'create-page');
    const handler = call[3];
    const result = await handler({ spaceKey: 'SPACE1', title: 'New Page', body: '<p>Body</p>' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Created page: New Page (https://example.atlassian.net/wiki/pages/new1)'
        }
      ]
    });
    expect(mockCreatePage).toHaveBeenCalledWith({
      spaceId: '123',
      title: 'New Page',
      body: { representation: 'storage', value: '<p>Body</p>' },
      parentId: undefined
    });
  });

  it('create-page handler handles non-200/201 response gracefully', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({
      data: { results: [{ id: 123, key: 'SPACE1', name: 'Space 1' }] },
    });
    const mockCreatePage = jest.fn().mockResolvedValue({
      status: 400,
      statusText: 'Bad Request',
    });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    MockedConfluenceClient.prototype.createPage = mockCreatePage;
    registerPageTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'create-page');
    const handler = call[3];
    const result = await handler({ spaceKey: 'SPACE1', title: 'New Page', body: '<p>Body</p>' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Failed to create page: 400 Bad Request'
        }
      ]
    });
    expect(mockCreatePage).toHaveBeenCalledWith({
      spaceId: '123',
      title: 'New Page',
      body: { representation: 'storage', value: '<p>Body</p>' },
      parentId: undefined
    });
  });

  it('delete-page handler returns expected data', async () => {
    const mockDeletePage = jest.fn().mockResolvedValue({});
    MockedConfluenceClient.prototype.deletePage = mockDeletePage;
    registerPageTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'delete-page');
    const handler = call[3];
    const result = await handler({ pageId: 'del1' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Deleted page: del1'
        }
      ]
    });
    expect(mockDeletePage).toHaveBeenCalledWith('del1');
  });
});