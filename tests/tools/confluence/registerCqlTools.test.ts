import { registerCqlTools } from '../../../src/tools/confluence/registerCqlTools';
import { ConfluenceClient } from '../../../src/clients/confluenceClient';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { AtlassianConfig } from '../../../src/clients/atlassianConfig';

jest.mock('../../../src/clients/confluenceClient');
const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;

describe('registerCqlTools', () => {
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
    registerCqlTools(server as unknown as McpServer, config);
    expect(server.tool).toHaveBeenCalledTimes(1);
    expect(server.tool).toHaveBeenCalledWith(
      'confluence_search',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('confluence_search handler returns expected data', async () => {
    const mockSearchWithCql = jest.fn().mockResolvedValue({
      data: {
        results: [
          { id: '1', title: 'Page 1', _links: { webui: '/spaces/SPACE/pages/1' } },
          { id: '2', title: 'Page 2', _links: { webui: '/spaces/SPACE/pages/2' } },
        ],
      },
    });
    MockedConfluenceClient.prototype.searchWithCql = mockSearchWithCql;
    registerCqlTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'confluence_search');
    expect(call).toBeDefined();
    const handler = call[3];
    const result = await handler({ cql: 'type=page', limit: 2, start: 0 }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Search Results (raw JSON):\n${JSON.stringify([
            { id: '1', title: 'Page 1', _links: { webui: '/spaces/SPACE/pages/1' } },
            { id: '2', title: 'Page 2', _links: { webui: '/spaces/SPACE/pages/2' } },
          ], null, 2)}`
        }
      ]
    });
    expect(mockSearchWithCql).toHaveBeenCalledWith('type=page', 2, 0);
  });

  it('confluence_search handler returns empty array if no results', async () => {
    const mockSearchWithCql = jest.fn().mockResolvedValue({ data: { results: [] } });
    MockedConfluenceClient.prototype.searchWithCql = mockSearchWithCql;
    registerCqlTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'confluence_search');
    const handler = call[3];
    const result = await handler({ cql: 'type=page', limit: 2, start: 0 }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No results found.'
        }
      ]
    });
  });

  it('confluence_search handler handles missing title and _links.webui', async () => {
    const mockSearchWithCql = jest.fn().mockResolvedValue({
      data: {
        results: [
          { id: '3', _links: {} },
          { id: '4', title: undefined },
          { id: '5', title: '', _links: undefined },
        ],
      },
    });
    MockedConfluenceClient.prototype.searchWithCql = mockSearchWithCql;
    registerCqlTools(server as unknown as McpServer, config);
    const call = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'confluence_search');
    const handler = call[3];
    const result = await handler({ cql: 'type=page' }, {});
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Search Results (raw JSON):\n${JSON.stringify([
            { id: '3', _links: {} },
            { id: '4', title: undefined },
            { id: '5', title: '', _links: undefined },
          ], null, 2)}`
        }
      ]
    });
  });
});
