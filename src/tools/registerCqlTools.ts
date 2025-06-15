import { z } from "zod";
import { ConfluenceClient } from "../clients/confluenceClient";

export function registerCqlTools(server: any, config: any) {
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
      const lines = results.map((page: any) => {
        const title = page.title || "Untitled";
        const url = `${config.baseUrl}${page._links?.webui || `/pages/${page.id}`}`;
        return `- ${title}: ${url}`;
      });
      return {
        content: [
          {
            type: "text",
            text: `Search Results:\n${lines.join("\n")}`
          }
        ]
      };
    }
  );
}
