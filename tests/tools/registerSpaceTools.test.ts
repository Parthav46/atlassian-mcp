import { registerSpaceTools } from '../../src/tools/registerSpaceTools';
import { ConfluenceClient } from '../../src/clients/confluenceClient';

jest.mock('../../src/clients/confluenceClient');
const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;

describe('registerSpaceTools', () => {
  let server: any;
  let config: any;

  beforeEach(() => {
    server = { tool: jest.fn() };
    config = { baseUrl: 'https://example.atlassian.net' };
    MockedConfluenceClient.mockClear();
  });

  it('registers all expected tools', () => {
    registerSpaceTools(server, config);
    expect(server.tool).toHaveBeenCalledTimes(4);
    const toolNames = server.tool.mock.calls.map((call: any[]) => call[0]);
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'get-folder',
        'get-space',
        'list-spaces',
        'get-pages-from-space',
      ])
    );
  });

  it('get-space handler returns expected data', async () => {
    const mockGetSpace = jest.fn().mockResolvedValue({
      data: {
        id: 'S1',
        key: 'SPACE',
        name: 'Space Name',
        description: { plain: { value: 'desc' } },
      },
    });
    MockedConfluenceClient.prototype.getSpace = mockGetSpace;
    registerSpaceTools(server, config);
    const getSpaceCall = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-space');
    expect(getSpaceCall).toBeDefined();
    const handler = getSpaceCall[3];
    const result = await handler({ spaceId: 'S1' }, {});
    expect(result).toEqual({
      id: 'S1',
      key: 'SPACE',
      name: 'Space Name',
      url: 'https://example.atlassian.net/spaces/SPACE',
      description: 'desc',
    });
    expect(mockGetSpace).toHaveBeenCalledWith('S1');
  });

  it('get-folder handler returns expected data', async () => {
    const mockGetFolder = jest.fn().mockResolvedValue({
      data: { id: 'F1', name: 'Folder 1', description: 'desc' },
    });
    MockedConfluenceClient.prototype.getFolder = mockGetFolder;
    registerSpaceTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-folder');
    const handler = call[3];
    const result = await handler({ folderId: 'F1' }, {});
    expect(result).toEqual({
      id: 'F1', name: 'Folder 1', url: 'https://example.atlassian.net/folders/F1', description: 'desc',
    });
    expect(mockGetFolder).toHaveBeenCalledWith('F1');
  });

  it('get-folder handler returns undefined description if missing', async () => {
    const mockGetFolder = jest.fn().mockResolvedValue({
      data: { id: 'F2', name: 'Folder 2' },
    });
    MockedConfluenceClient.prototype.getFolder = mockGetFolder;
    registerSpaceTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-folder');
    const handler = call[3];
    const result = await handler({ folderId: 'F2' }, {});
    expect(result).toEqual({
      id: 'F2', name: 'Folder 2', url: 'https://example.atlassian.net/folders/F2', description: undefined,
    });
  });

  it('list-spaces handler returns expected data', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({
      data: { results: [
        { id: 'S1', key: 'SPACE1', name: 'Space 1' },
        { id: 'S2', key: 'SPACE2', name: 'Space 2' },
      ] },
    });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    registerSpaceTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'list-spaces');
    const handler = call[3];
    const result = await handler({ start: 0, limit: 2 }, {});
    expect(result).toEqual({
      spaces: [
        { id: 'S1', key: 'SPACE1', name: 'Space 1', url: 'https://example.atlassian.net/spaces/SPACE1' },
        { id: 'S2', key: 'SPACE2', name: 'Space 2', url: 'https://example.atlassian.net/spaces/SPACE2' },
      ],
    });
    expect(mockListSpaces).toHaveBeenCalledWith(0, 2);
  });

  it('list-spaces handler returns empty array if no results', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({ data: { results: [] } });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    registerSpaceTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'list-spaces');
    const handler = call[3];
    const result = await handler({}, {});
    expect(result).toEqual({ spaces: [] });
  });

  it('get-pages-from-space handler returns expected data', async () => {
    const mockGetPagesFromSpace = jest.fn().mockResolvedValue({
      data: { results: [
        { id: 'P1', title: 'Page 1' },
        { id: 'P2', title: 'Page 2' },
      ] },
    });
    MockedConfluenceClient.prototype.getPagesFromSpace = mockGetPagesFromSpace;
    registerSpaceTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-pages-from-space');
    const handler = call[3];
    const result = await handler({ spaceId: 'SPACE', limit: 2 }, {});
    expect(result).toEqual({
      pages: [
        { id: 'P1', title: 'Page 1', url: 'https://example.atlassian.net/spaces/SPACE/pages/P1' },
        { id: 'P2', title: 'Page 2', url: 'https://example.atlassian.net/spaces/SPACE/pages/P2' },
      ],
    });
    expect(mockGetPagesFromSpace).toHaveBeenCalledWith('SPACE', 2, undefined);
  });

  it('get-pages-from-space handler returns empty array if no results', async () => {
    const mockGetPagesFromSpace = jest.fn().mockResolvedValue({ data: { results: [] } });
    MockedConfluenceClient.prototype.getPagesFromSpace = mockGetPagesFromSpace;
    registerSpaceTools(server, config);
    const call = server.tool.mock.calls.find((call: any[]) => call[0] === 'get-pages-from-space');
    const handler = call[3];
    const result = await handler({ spaceId: 'SPACE' }, {});
    expect(result).toEqual({ pages: [] });
  });
});
