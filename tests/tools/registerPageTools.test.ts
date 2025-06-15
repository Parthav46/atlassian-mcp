import { registerPageTools } from '../../src/tools/registerPageTools';
import { ConfluenceClient } from '../../src/clients/confluenceClient';

jest.mock('../../src/clients/confluenceClient');
const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;

describe('registerPageTools', () => {
  let server: any;
  let config: any;

  beforeEach(() => {
    server = { tool: jest.fn() };
    config = { baseUrl: 'https://example.atlassian.net' };
    MockedConfluenceClient.mockClear();
  });

  it('registers all expected tools', () => {
    registerPageTools(server, config);
    // Should register 6 tools
    expect(server.tool).toHaveBeenCalledTimes(6);
    const toolNames = server.tool.mock.calls.map((call: any[]) => call[0]);
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'get-page',
        'update-page',
        'get-children',
        'create-page',
        'delete-page',
        'search-pages-by-title',
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
    registerPageTools(server, config);
    // Find get-page tool registration
    const getPageCall = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-page');
    expect(getPageCall).toBeDefined();
    const handler = getPageCall[3];
    const result = await handler({ pageId: '123' }, {});
    expect(result).toEqual({
      id: '123',
      title: 'Test Page',
      url: 'https://example.atlassian.net/pages/123',
      content: '<p>Test</p>',
    });
    expect(mockGetPage).toHaveBeenCalledWith('123', 'storage');
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
    registerPageTools(server, config);
    const getPageCall = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-page');
    const handler = getPageCall[3];
    const result = await handler({ pageId: '123', bodyFormat: 'markdown' }, {});
    expect(result).toEqual({
      id: '123',
      title: 'Test Page',
      url: 'https://example.atlassian.net/pages/123',
      content: '# Markdown',
    });
    expect(mockGetPage).toHaveBeenCalledWith('123', 'markdown');
  });

  it('get-page handler handles missing body gracefully', async () => {
    const mockGetPage = jest.fn().mockResolvedValue({
      data: { id: '123', title: 'Test Page' },
    });
    MockedConfluenceClient.prototype.getPage = mockGetPage;
    registerPageTools(server, config);
    const getPageCall = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-page');
    const handler = getPageCall[3];
    const result = await handler({ pageId: '123' }, {});
    expect(result).toEqual({
      id: '123',
      title: 'Test Page',
      url: 'https://example.atlassian.net/pages/123',
      content: '',
    });
  });

  it('get-page handler handles missing storage and markdown fields', async () => {
    const mockGetPage = jest.fn().mockResolvedValue({
      data: { id: '124', title: 'No Body', body: {} },
    });
    MockedConfluenceClient.prototype.getPage = mockGetPage;
    registerPageTools(server, config);
    const getPageCall = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-page');
    const handler = getPageCall[3];
    const resultStorage = await handler({ pageId: '124', bodyFormat: 'storage' }, {});
    expect(resultStorage).toEqual({
      id: '124',
      title: 'No Body',
      url: 'https://example.atlassian.net/pages/124',
      content: '',
    });
    const resultMarkdown = await handler({ pageId: '124', bodyFormat: 'markdown' }, {});
    expect(resultMarkdown).toEqual({
      id: '124',
      title: 'No Body',
      url: 'https://example.atlassian.net/pages/124',
      content: '',
    });
  });

  it('update-page handler returns expected data', async () => {
    const mockUpdatePage = jest.fn().mockResolvedValue({
      data: { id: '123', title: 'Updated Title', status: 'current' },
    });
    MockedConfluenceClient.prototype.updatePage = mockUpdatePage;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'update-page');
    const handler = call[3];
    const result = await handler({ pageId: '123', data: { title: 'Updated Title' } }, {});
    expect(result).toEqual({ id: '123', title: 'Updated Title', status: 'current' });
    expect(mockUpdatePage).toHaveBeenCalledWith('123', { title: 'Updated Title' });
  });

  it('update-page handler defaults status to updated if missing', async () => {
    const mockUpdatePage = jest.fn().mockResolvedValue({
      data: { id: '123', title: 'Updated Title' },
    });
    MockedConfluenceClient.prototype.updatePage = mockUpdatePage;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'update-page');
    const handler = call[3];
    const result = await handler({ pageId: '123', data: { title: 'Updated Title' } }, {});
    expect(result).toEqual({ id: '123', title: 'Updated Title', status: 'updated' });
  });

  it('get-children handler returns children', async () => {
    const mockGetChildren = jest.fn().mockResolvedValue({
      data: { results: [
        { id: 'c1', title: 'Child 1' },
        { id: 'c2', title: 'Child 2' },
      ] },
    });
    MockedConfluenceClient.prototype.getChildren = mockGetChildren;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-children');
    const handler = call[3];
    const result = await handler({ pageId: 'parent' }, {});
    expect(result).toEqual({
      children: [
        { id: 'c1', title: 'Child 1', url: 'https://example.atlassian.net/pages/c1' },
        { id: 'c2', title: 'Child 2', url: 'https://example.atlassian.net/pages/c2' },
      ],
    });
    expect(mockGetChildren).toHaveBeenCalledWith('parent');
  });

  it('get-children handler returns empty array if no children', async () => {
    const mockGetChildren = jest.fn().mockResolvedValue({ data: { results: [] } });
    MockedConfluenceClient.prototype.getChildren = mockGetChildren;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-children');
    const handler = call[3];
    const result = await handler({ pageId: 'parent' }, {});
    expect(result).toEqual({ children: [] });
  });

  it('get-children handler returns empty array if results is undefined', async () => {
    const mockGetChildren = jest.fn().mockResolvedValue({ data: {} });
    MockedConfluenceClient.prototype.getChildren = mockGetChildren;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-children');
    const handler = call[3];
    const result = await handler({ pageId: 'parent' }, {});
    expect(result).toEqual({ children: [] });
  });

  it('create-page handler returns expected data', async () => {
    const mockCreatePage = jest.fn().mockResolvedValue({
      data: { id: 'new1', title: 'New Page' },
    });
    MockedConfluenceClient.prototype.createPage = mockCreatePage;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'create-page');
    const handler = call[3];
    const result = await handler({ spaceId: 'S', title: 'New Page', body: '<p>Body</p>' }, {});
    expect(result).toEqual({ id: 'new1', title: 'New Page', url: 'https://example.atlassian.net/pages/new1' });
    expect(mockCreatePage).toHaveBeenCalledWith('S', 'New Page', '<p>Body</p>', undefined);
  });

  it('create-page handler calls with parentId', async () => {
    const mockCreatePage = jest.fn().mockResolvedValue({ data: { id: 'new2', title: 'Child Page' } });
    MockedConfluenceClient.prototype.createPage = mockCreatePage;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'create-page');
    const handler = call[3];
    const result = await handler({ spaceId: 'S', title: 'Child Page', body: '<p>Body</p>', parentId: 'parent1' }, {});
    expect(result).toEqual({ id: 'new2', title: 'Child Page', url: 'https://example.atlassian.net/pages/new2' });
    expect(mockCreatePage).toHaveBeenCalledWith('S', 'Child Page', '<p>Body</p>', 'parent1');
  });

  it('create-page handler handles missing fields gracefully', async () => {
    const mockCreatePage = jest.fn().mockResolvedValue({ data: {} });
    MockedConfluenceClient.prototype.createPage = mockCreatePage;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'create-page');
    const handler = call[3];
    const result = await handler({ spaceId: 'S', title: '', body: '' }, {});
    expect(result).toEqual({ id: undefined, title: undefined, url: 'https://example.atlassian.net/pages/undefined' });
  });

  it('delete-page handler returns expected data', async () => {
    const mockDeletePage = jest.fn().mockResolvedValue({});
    MockedConfluenceClient.prototype.deletePage = mockDeletePage;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'delete-page');
    const handler = call[3];
    const result = await handler({ pageId: 'del1' }, {});
    expect(result).toEqual({ id: 'del1', status: 'deleted' });
    expect(mockDeletePage).toHaveBeenCalledWith('del1');
  });

  it('search-pages-by-title handler returns pages', async () => {
    const mockSearchPagesByTitle = jest.fn().mockResolvedValue({
      data: { results: [
        { id: '1', title: 'Page 1', space: { key: 'S' } },
        { id: '2', title: 'Page 2', space: { key: 'S' } },
      ] },
    });
    MockedConfluenceClient.prototype.searchPagesByTitle = mockSearchPagesByTitle;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'search-pages-by-title');
    const handler = call[3];
    const result = await handler({ title: 'Page' }, {});
    expect(result).toEqual({
      pages: [
        { id: '1', title: 'Page 1', url: 'https://example.atlassian.net/spaces/S/pages/1' },
        { id: '2', title: 'Page 2', url: 'https://example.atlassian.net/spaces/S/pages/2' },
      ],
    });
    expect(mockSearchPagesByTitle).toHaveBeenCalledWith('Page');
  });

  it('search-pages-by-title handler uses pageResults if present', async () => {
    const mockSearchPagesByTitle = jest.fn().mockResolvedValue({
      data: { pageResults: [ { id: '3', title: 'Page 3', space: { key: 'S' } } ] },
    });
    MockedConfluenceClient.prototype.searchPagesByTitle = mockSearchPagesByTitle;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'search-pages-by-title');
    const handler = call[3];
    const result = await handler({ title: 'Page' }, {});
    expect(result).toEqual({
      pages: [ { id: '3', title: 'Page 3', url: 'https://example.atlassian.net/spaces/S/pages/3' } ],
    });
  });

  it('search-pages-by-title handler handles missing title and space.key', async () => {
    const mockSearchPagesByTitle = jest.fn().mockResolvedValue({
      data: { results: [ { id: '4' } ] },
    });
    MockedConfluenceClient.prototype.searchPagesByTitle = mockSearchPagesByTitle;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'search-pages-by-title');
    const handler = call[3];
    const result = await handler({ title: 'Page' }, {});
    expect(result).toEqual({
      pages: [ { id: '4', title: 'Untitled', url: 'https://example.atlassian.net/spaces//pages/4' } ],
    });
  });

  it('search-pages-by-title handler returns empty array if no results', async () => {
    const mockSearchPagesByTitle = jest.fn().mockResolvedValue({ data: { results: [] } });
    MockedConfluenceClient.prototype.searchPagesByTitle = mockSearchPagesByTitle;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'search-pages-by-title');
    const handler = call[3];
    const result = await handler({ title: 'Nothing' }, {});
    expect(result).toEqual({ pages: [] });
  });

  it('search-pages-by-title handler returns empty array if both results and pageResults are missing', async () => {
    const mockSearchPagesByTitle = jest.fn().mockResolvedValue({ data: {} });
    MockedConfluenceClient.prototype.searchPagesByTitle = mockSearchPagesByTitle;
    registerPageTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'search-pages-by-title');
    const handler = call[3];
    const result = await handler({ title: 'Nothing' }, {});
    expect(result).toEqual({ pages: [] });
  });
});