import { registerSpaceTools } from '../../../src/tools/confluence/registerSpaceTools';
import { ConfluenceClient } from '../../../src/clients/confluenceClient';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { AtlassianConfig } from '../../../src/clients/atlassianConfig';

jest.mock('../../../src/clients/confluenceClient');
const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;

describe('registerSpaceTools', () => {
  let server: { tool: jest.Mock };
  let config: AtlassianConfig;

  beforeEach(() => {
    server = { tool: jest.fn() };
    config = { 
      baseUrl: 'https://example.atlassian.net',
      token: 'test-token',
      username: 'test-user',
    };
    MockedConfluenceClient.mockClear();
  });

  it('registers all expected tools', () => {
    registerSpaceTools(server as unknown as McpServer, config);
    expect(server.tool).toHaveBeenCalledTimes(3);
    const toolNames = server.tool.mock.calls.map((call: unknown[]) => call[0]);
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'get-folder',
        'get-space',
        'list-spaces'
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
        _links: { webui: '/spaces/SPACE' },
      },
    });
    MockedConfluenceClient.prototype.getSpace = mockGetSpace;
    registerSpaceTools(server as unknown as McpServer, config);
    const getSpaceCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-space');
    expect(getSpaceCall).toBeDefined();
    const handler = getSpaceCall[3];
    const result = await handler({ spaceId: 'S1' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Space: Space Name\nKey: SPACE\nID: S1\nURL: https://example.atlassian.net/wiki/spaces/SPACE\nDescription: desc'
        }
      ]
    });
    expect(mockGetSpace).toHaveBeenCalledWith('S1');
  });

  it('get-space handler handles missing description and plain/value', async () => {
    const mockGetSpace = jest.fn().mockResolvedValue({
      data: {
        id: 'S2',
        key: 'SPACE2',
        name: 'Space 2',
        description: undefined,
        _links: { webui: undefined },
      },
    });
    MockedConfluenceClient.prototype.getSpace = mockGetSpace;
    registerSpaceTools(server as unknown as McpServer, config);
    const getSpaceCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-space');
    const handler = getSpaceCall[3];
    const result = await handler({ spaceId: 'S2' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Space: Space 2\nKey: SPACE2\nID: S2\nURL: No link available\nDescription: None'
        }
      ]
    });

    // missing plain
    mockGetSpace.mockResolvedValueOnce({
      data: {
        id: 'S3',
        key: 'SPACE3',
        name: 'Space 3',
        description: {},
        _links: { webui: undefined },
      },
    });
    const result2 = await handler({ spaceId: 'S3' }, {});
    expect(result2).toEqual({
      content: [
        {
          type: 'text',
          text: 'Space: Space 3\nKey: SPACE3\nID: S3\nURL: No link available\nDescription: None'
        }
      ]
    });

    // missing value
    mockGetSpace.mockResolvedValueOnce({
      data: {
        id: 'S4',
        key: 'SPACE4',
        name: 'Space 4',
        description: { plain: {} },
        _links: { webui: undefined },
      },
    });
    const result3 = await handler({ spaceId: 'S4' }, {});
    expect(result3).toEqual({
      content: [
        {
          type: 'text',
          text: 'Space: Space 4\nKey: SPACE4\nID: S4\nURL: No link available\nDescription: None'
        }
      ]
    });
  });

  it('get-folder handler returns expected data', async () => {
    const mockGetFolder = jest.fn().mockResolvedValue({
      data: { id: 'F1', title: 'Folder 1', _links: { base: 'https://example.atlassian.net', webui: '/wiki/folders/F1' } },
    });
    MockedConfluenceClient.prototype.getFolder = mockGetFolder;
    registerSpaceTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-folder');
    const handler = call[3];
    const result = await handler({ folderId: 'F1' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Folder: Folder 1\nID: F1\nURL: https://example.atlassian.net/wiki/folders/F1\nDescription: None'
        }
      ]
    });
    expect(mockGetFolder).toHaveBeenCalledWith('F1');
  });

  it('get-folder handler returns undefined description if missing', async () => {
    const mockGetFolder = jest.fn().mockResolvedValue({
      data: { id: 'F2', name: 'Folder 2' },
    });
    MockedConfluenceClient.prototype.getFolder = mockGetFolder;
    registerSpaceTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'get-folder');
    const handler = call[3];
    const result = await handler({ folderId: 'F2' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Folder: Folder 2\nID: F2\nURL: https://example.atlassian.net/folders/F2\nDescription: None'
        }
      ]
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
    registerSpaceTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'list-spaces');
    const handler = call[3];
    const result = await handler({ start: 0, limit: 2 }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Spaces:\n- Space 1 (KEY: SPACE1, ID: S1): https://example.atlassian.net/spaces/SPACE1\n- Space 2 (KEY: SPACE2, ID: S2): https://example.atlassian.net/spaces/SPACE2'
        }
      ]
    });
    expect(mockListSpaces).toHaveBeenCalledWith(0, 2, undefined);
  });

  it('list-spaces handler filters by keys', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({
      data: { results: [
        { id: 'SPACEID', key: 'S1', name: 'Sample Space' }
      ] },
    });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    registerSpaceTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'list-spaces');
    const handler = call[3];
    const result = await handler({ keys: 'S1' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Spaces:\n- Sample Space (KEY: S1, ID: SPACEID): https://example.atlassian.net/spaces/S1'
        }
      ]
    });
    expect(mockListSpaces).toHaveBeenCalledWith(undefined, undefined, 'S1');
  });

  it('list-spaces handler returns empty array if no results', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({ data: { results: [] } });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    registerSpaceTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'list-spaces');
    const handler = call[3];
    const result = await handler({}, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No spaces found.'
        }
      ]
    });
  });

  it('list-spaces handler handles undefined results', async () => {
    const mockListSpaces = jest.fn().mockResolvedValue({ data: {} });
    MockedConfluenceClient.prototype.listSpaces = mockListSpaces;
    registerSpaceTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'list-spaces');
    const handler = call[3];
    const result = await handler({}, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No spaces found.'
        }
      ]
    });
  });
});
