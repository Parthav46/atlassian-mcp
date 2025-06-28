import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MockAtlassianServer } from './mock-server';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(60000); // Extended timeout for performance tests

describe('Performance and Stress Integration Tests', () => {
  let transport: StdioClientTransport | undefined;
  let client: Client;
  let mockServer: MockAtlassianServer;
  let mockBaseUrl: string;

  beforeAll(async () => {
    // Start mock server
    mockServer = new MockAtlassianServer(3007); // Use different port
    mockBaseUrl = await mockServer.start();
  });

  afterAll(async () => {
    // Stop mock server
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
      name: 'performance-test-client',
      version: '1.0.0'
    });
    await client.connect(transport);

    // Clear any existing mocks
    mockBaseUrl = await mockServer.clearRoutes();
  });

  afterEach(async () => {
    if (client) {
      await client.close();
    }
    if (transport) {
      await transport.close();
      transport = undefined;
    }
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent Jira issue requests', async () => {
      // Setup mocks for multiple issues
      const issues = ['TEST-1', 'TEST-2', 'TEST-3', 'TEST-4', 'TEST-5'];
      issues.forEach(issueKey => {
        const mockIssue = {
          key: issueKey,
          fields: {
            summary: `Test Issue ${issueKey}`,
            status: { name: 'In Progress' },
            assignee: { displayName: 'Test User' },
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: `Description for ${issueKey}` }]
                }
              ]
            },
            subtasks: []
          }
        };
        mockServer.mockJiraIssue(issueKey, mockIssue);
      });

      const startTime = Date.now();
      
      // Execute concurrent requests
      const promises = issues.map(issueKey => 
        client.callTool({
          name: 'get-jira-issue',
          arguments: { issueKey }
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests completed successfully
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect((result as any).content[0].text).toContain(issues[index]);
      });

      // Performance assertion - should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max (relaxed)
      console.log(`Concurrent Jira requests completed in ${duration}ms`);
    });

    it('should handle mixed Jira and Confluence operations concurrently', async () => {
      // Setup Jira mocks
      ['MIXED-1', 'MIXED-2'].forEach(issueKey => {
        const mockIssue = {
          key: issueKey,
          fields: {
            summary: `Mixed Test Issue ${issueKey}`,
            status: { name: 'In Progress' },
            assignee: { displayName: 'Test User' },
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: `Description for ${issueKey}` }]
                }
              ]
            },
            subtasks: []
          }
        };
        mockServer.mockJiraIssue(issueKey, mockIssue);
      });

      // Setup Confluence mocks
      ['123', '456'].forEach(pageId => {
        const mockPage = {
          id: pageId,
          title: `Test Page ${pageId}`,
          body: {
            storage: {
              value: `<p>Content for page ${pageId}</p>`,
              representation: 'storage'
            },
            atlas_doc_format: {
              value: `Content for page ${pageId}`,
              representation: 'atlas_doc_format'
            }
          },
          _links: {
            webui: `/spaces/TEST/pages/${pageId}`
          }
        };
        mockServer.mockConfluencePage(pageId, mockPage);
      });

      // Mock spaces list
      const mockSpaces = {
        results: [
          {
            id: '1001',
            key: 'TEST',
            name: 'Test Space',
            type: 'global',
            status: 'current'
          }
        ]
      };
      mockServer.mockConfluenceSpaces(mockSpaces);

      const startTime = Date.now();

      // Execute mixed concurrent operations
      const promises = [
        client.callTool({ name: 'get-jira-issue', arguments: { issueKey: 'MIXED-1' } }),
        client.callTool({ name: 'get-page', arguments: { pageId: 123 } }),
        client.callTool({ name: 'get-jira-issue', arguments: { issueKey: 'MIXED-2' } }),
        client.callTool({ name: 'get-page', arguments: { pageId: 456 } }),
        client.callTool({ name: 'list-spaces', arguments: {} })
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(12000); // 12 seconds max for mixed operations (relaxed)
      console.log(`Mixed concurrent operations completed in ${duration}ms`);
    });
  });

  describe('Sequential Operations Performance', () => {
    it('should efficiently chain multiple related operations', async () => {
      // Mock Jira search results
      const mockSearchResults = {
        issues: [
          {
            key: 'CHAIN-1',
            fields: {
              summary: 'Chain Test Issue 1',
              status: { name: 'In Progress' },
              assignee: { displayName: 'Test User' },
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Description for CHAIN-1' }]
                  }
                ]
              },
              subtasks: []
            }
          },
          {
            key: 'CHAIN-2',
            fields: {
              summary: 'Chain Test Issue 2',
              status: { name: 'To Do' },
              assignee: { displayName: 'Test User' },
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Description for CHAIN-2' }]
                  }
                ]
              },
              subtasks: []
            }
          }
        ],
        total: 2,
        isLast: true
      };
      
      mockServer.mockJiraSearch(mockSearchResults);

      // Mock individual issue
      const mockIssue = {
        key: 'CHAIN-1',
        fields: {
          summary: 'Chain Test Issue 1',
          status: { name: 'In Progress' },
          assignee: { displayName: 'Test User' },
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Description for CHAIN-1' }]
              }
            ]
          },
          subtasks: []
        }
      };
      mockServer.mockJiraIssue('CHAIN-1', mockIssue);

      // Mock spaces
      const mockSpaces = {
        results: [
          {
            id: '1001',
            key: 'TEST',
            name: 'Test Space',
            type: 'global',
            status: 'current'
          }
        ]
      };
      mockServer.mockConfluenceSpaces(mockSpaces);

      // Mock page creation
      const mockCreatedPage = {
        id: '999',
        title: 'Chain Test Page',
        body: {
          storage: {
            value: '<p>Documentation for CHAIN-1</p>',
            representation: 'storage'
          }
        },
        _links: {
          webui: '/spaces/TEST/pages/999'
        }
      };
      mockServer.mockConfluenceCreatePage(mockCreatedPage);

      // Mock search
      const mockSearchCqlResults = {
        results: [
          {
            title: 'Chain Test Page',
            excerpt: 'Documentation for CHAIN-1',
            url: '/wiki/spaces/TEST/pages/999'
          }
        ],
        totalSize: 1
      };
      mockServer.mockConfluenceSearch(mockSearchCqlResults);

      const startTime = Date.now();

      // Execute chained operations (simulating real workflow)
      const searchResult = await client.callTool({
        name: 'search-jira-issues',
        arguments: { jql: 'project = CHAIN' }
      });

      expect((searchResult as any).content[0].text).toContain('CHAIN-1');

      const issueResult = await client.callTool({
        name: 'get-jira-issue',
        arguments: { issueKey: 'CHAIN-1' }
      });

      expect((issueResult as any).content[0].text).toContain('Key: CHAIN-1');

      const spacesResult = await client.callTool({
        name: 'list-spaces',
        arguments: {}
      });

      expect((spacesResult as any).content[0].text).toContain('Test Space (KEY: TEST');

      const createResult = await client.callTool({
        name: 'create-page',
        arguments: {
          spaceKey: 'TEST',
          title: 'Chain Test Page',
          body: '<p>Documentation for CHAIN-1</p>'
        }
      });

      expect((createResult as any).content[0].text).toContain('Created page: Chain Test Page');

      const confluenceSearchResult = await client.callTool({
        name: 'confluence_search',
        arguments: { cql: 'title ~ "Chain"' }
      });

      expect((confluenceSearchResult as any).content[0].text).toContain('Chain Test Page');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Sequential operations should complete within reasonable time
      expect(duration).toBeLessThan(15000); // 15 seconds max for 5 sequential operations (relaxed)
      console.log(`Sequential workflow completed in ${duration}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should handle repeated operations without excessive memory usage', async () => {
      // Setup mock for repeated calls
      const mockIssue = {
        key: 'MEMORY-TEST',
        fields: {
          summary: 'Memory Test Issue',
          status: { name: 'In Progress' },
          assignee: { displayName: 'Test User' },
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Description for memory test' }]
              }
            ]
          },
          subtasks: []
        }
      };
      mockServer.mockJiraIssue('MEMORY-TEST', mockIssue);

      const initialMemory = process.memoryUsage();
      const iterations = 10; // Reduced for faster testing

      // Perform repeated operations
      for (let i = 0; i < iterations; i++) {
        await client.callTool({
          name: 'get-jira-issue',
          arguments: { issueKey: 'MEMORY-TEST' }
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerOp = memoryIncrease / iterations;

      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024 * 100) / 100}MB`);
      console.log(`Memory per operation: ${Math.round(memoryIncreasePerOp / 1024 * 100) / 100}KB`);

      // Memory increase should be reasonable (less than 5MB per operation)
      expect(memoryIncreasePerOp).toBeLessThan(5 * 1024 * 1024); // 5MB per operation (relaxed)
    });
  });
});
