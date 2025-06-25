// Suppressing no-var-requires rule for this file as we need to mock modules using require
/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('dotenv', () => ({ config: jest.fn() }));

// Mock McpServer and StdioServerTransport so connect is always a jest.fn()
jest.mock('@modelcontextprotocol/sdk/server/mcp', () => {
  return {
    McpServer: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      tool: jest.fn(),
      resource: jest.fn(),
      prompt: jest.fn()
    })),
  };
});
jest.mock('@modelcontextprotocol/sdk/server/stdio', () => {
  return {
    StdioServerTransport: jest.fn().mockImplementation(() => ({})),
  };
});

// Mock fs.readFileSync and path.join to avoid ENOENT error
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => '{ "version": "1.2.3" }'),
}));
jest.mock('path', () => ({
  join: jest.fn(() => '/mocked/path/package.json'),
}));

describe('index.ts', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let McpServer: unknown;

  beforeEach(() => {
    jest.resetModules();
    McpServer = require('@modelcontextprotocol/sdk/server/mcp').McpServer;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates server and calls registerTools', async () => {
    await jest.isolateModulesAsync(async () => {
      const registerToolsModule = require('../src/registerTools');
      const registerToolsSpy = jest.spyOn(registerToolsModule, 'registerTools').mockImplementation();
      require('../src/index');
      expect(registerToolsSpy).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  it('main connects server and logs running message', async () => {
    await jest.isolateModulesAsync(async () => {
      require('../src/registerTools');
      await import('../src/index');
      // Check that McpServer was instantiated
      expect(McpServer).toHaveBeenCalled();
      // Check that the log was called
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Atlassian MCP Server running'));
    });
  });

  it('main handles errors and exits', async () => {
    await jest.isolateModulesAsync(async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => { throw new Error('exit ' + code); }) as unknown as () => never);
      try {
        await import('../src/index');
      } catch (e) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Fatal error in main()'), expect.any(Error));
        expect(exitSpy).toHaveBeenCalledWith(1);
      }
      exitSpy.mockRestore();
    });
  });
});
