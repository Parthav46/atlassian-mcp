import axios, { AxiosInstance } from 'axios';
import { AtlassianConfig } from './atlassianConfig';
import type { CqlResult, CqlSearchParams, CreatePageRequest, GetPageRequest, Page, UpdatePageRequest } from './confluenceClient.type';

// Suppressing lint as Confluence API error handler param is defined as any
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function confluenceErrorHandler(error: any) {
  if (error.response) {
    console.error('[Confluence API Error]', {
      url: error.config?.url,
      status: error.response.status,
      data: JSON.stringify(error.response.data, null, 2),
    });
  } else {
    console.error('[Confluence API Error]', error.message);
  }
  return Promise.reject(error);
}

export class ConfluenceClient {
  private axios: AxiosInstance;

  constructor(config: AtlassianConfig) {
    const authString = Buffer.from(`${config.username}:${config.token}`).toString('base64');
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add error logging
    this.axios.interceptors.response.use(
      (response) => response,
      confluenceErrorHandler
    );
  }

  // Get a folder by ID
  async getFolder(folderId: number) {
    return this.axios.get(`/wiki/api/v2/folders/${folderId}`);
  }

  // Get a space by ID
  async getSpace(spaceId: number) {
    return this.axios.get(`/wiki/api/v2/spaces/${spaceId}`);
  }

  // List all spaces (optionally filter by key(s))
  async listSpaces(start?: number, limit?: number, keys?: string) {
    const params: { start?: number; limit?: number; keys?: string } = {};
    if (start !== undefined) params.start = start;
    if (limit !== undefined) params.limit = limit;
    if (keys !== undefined) params.keys = keys;
    return this.axios.get(`/wiki/api/v2/spaces`, { params });
  }

  // List children of a page
  async getChildren(pageId: number) {
    return this.axios.get(`/wiki/api/v2/pages/${pageId}/children`);
  }

  // Get a page by ID (with body, support for storage and markdown)
  async getPage(data: GetPageRequest) {
    return this.axios.get<Page>(`/wiki/api/v2/pages/${data.id}`, { data });
  }

  // Create a new page
  async createPage(data: CreatePageRequest) {
    return this.axios.post<Page>(`/wiki/api/v2/pages`, data);
  }

  // Update a page by ID
  async updatePage(pageId: number, data: UpdatePageRequest) {
    return this.axios.put<Page>(`/wiki/api/v2/pages/${pageId}`, data);
  }

  // Delete a page by ID
  async deletePage(pageId: number) {
    return this.axios.delete(`/wiki/api/v2/pages/${pageId}`);
  }

  // Advanced search using CQL
  async searchWithCql(cql: string, limit?: number, start?: number) {
    const params: CqlSearchParams = { cql };
    if (limit !== undefined) params.limit = limit;
    if (start !== undefined) params.start = start;
    return this.axios.get<CqlResult>(`/wiki/rest/api/content/search`, { params });
  }
}