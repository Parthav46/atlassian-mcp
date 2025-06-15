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
      if (!results.length) {
        return { pages: [] };
      }
      const pages = results.map((page: any) => ({
        id: page.id,
        title: page.title || "Untitled",
        url: `${config.baseUrl}/spaces/${page.space?.key || ''}/pages/${page.id}`
      }));
      return { pages };
    }
  );
}
