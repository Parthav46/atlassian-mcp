import { z } from "zod";
import { ConfluenceClient } from "../../clients/confluenceClient";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export function registerCqlTools(server: McpServer, config: any) {
  server.tool(
    "confluence_search",

    "Advanced Confluence search using CQL (Confluence Query Language)",
    { cql: z.string().describe("CQL query string"), limit: z.number().optional(), start: z.number().optional() },
    async (
      { cql, limit, start }: { cql: string; limit?: number; start?: number },
      _extra: any
    ) => {
      const client = new ConfluenceClient(config);
      const response = await client.searchWithCql(cql, limit, start);
      const results = response.data.results || [];
      if (!Array.isArray(results) || !results.length) {
        return {
          content: [
            {
              type: "text",
              text: "No results found."
            }
          ]
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Search Results (raw JSON):\n${JSON.stringify(results, null, 2)}`
          }
        ]
      };
    }
  );
}
