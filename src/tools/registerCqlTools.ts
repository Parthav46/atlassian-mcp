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
        if (!page._links || !page._links.webui) {
          return `- ${title}: Page ID: ${page.id}`;
        }
        const url = `${config.baseUrl}/wiki${page._links.webui}`;
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
