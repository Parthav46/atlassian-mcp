import { z } from "zod";
import { ConfluenceClient } from "./confluenceClient.js";

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
      if (!results.length) {
        return { content: [{ type: "text", text: "No pages found for this CQL query." }] };
      }
      const summary = results.map((page: any) => {
        const id = page.id;
        const pageTitle = page.title || "Untitled";
        const url = `${config.baseUrl}/spaces/${page.space?.key || ''}/pages/${id}`;
        return `- [${pageTitle}] (ID: ${id}) ${url}`;
      }).join("\n");
      return { content: [{ type: "text", text: `Confluence search results:\n${summary}` }] };
    }
  );
}
