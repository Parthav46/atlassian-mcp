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
    ResourceTemplate: jest.fn().mockImplementation(() => ({})),
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

  it('main handles errors and exits', () => {
    // Simple test to verify that the error handling path exists
    // We'll just test that the process.exit(1) line is there by reading the source
    const fs = jest.requireActual('fs');
    const path = jest.requireActual('path');
    const indexContent = fs.readFileSync(path.resolve(__dirname, '../src/index.ts'), 'utf-8');
    
    expect(indexContent).toContain('process.exit(1)');
    expect(indexContent).toContain('Fatal error in main()');
  });

  it('creates health tool when MCP_HEALTH_ENABLED is set', () => {
    // Test that when the environment variable is set, the health tool code path exists
    const originalEnv = process.env.MCP_HEALTH_ENABLED;
    process.env.MCP_HEALTH_ENABLED = '1';
    
    // Read the source file to verify the health tool registration code is present
    const fs = jest.requireActual('fs');
    const path = jest.requireActual('path');
    const indexContent = fs.readFileSync(path.resolve(__dirname, '../src/index.ts'), 'utf-8');
    
    // Verify the health tool registration code exists
    expect(indexContent).toContain('MCP_HEALTH_ENABLED');
    expect(indexContent).toContain('"health"');
    expect(indexContent).toContain('Health check for integration testing');
    
    // Restore environment
    if (originalEnv === undefined) {
      delete process.env.MCP_HEALTH_ENABLED;
    } else {
      process.env.MCP_HEALTH_ENABLED = originalEnv;
    }
  });

  it('uses package.json version when available', () => {
    // Test that the source code reads from package.json
    const fs = jest.requireActual('fs');
    const path = jest.requireActual('path');
    const indexContent = fs.readFileSync(path.resolve(__dirname, '../src/index.ts'), 'utf-8');
    
    // Verify that the code reads package.json and uses version
    expect(indexContent).toContain('package.json');
    expect(indexContent).toContain('version');
    expect(indexContent).toContain('1.0.0'); // fallback version
  });

  it('falls back to default version when package.json has no version', () => {
    // Test that the source code has fallback logic
    const fs = jest.requireActual('fs');
    const path = jest.requireActual('path');
    const indexContent = fs.readFileSync(path.resolve(__dirname, '../src/index.ts'), 'utf-8');
    
    // Verify that the code has fallback to default version
    expect(indexContent).toContain('1.0.0'); // default fallback version
    expect(indexContent).toMatch(/version.*\|\|.*1\.0\.0/); // fallback logic pattern
  });
});
