import axios, { AxiosInstance } from 'axios';

export interface ConfluenceConfig {
  baseUrl: string;
  token: string;
  username: string;
}

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

  constructor(config: ConfluenceConfig) {
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

  // Get a page by ID (with body, support for storage and markdown)
  async getPage(pageId: number, bodyFormat: 'storage' | 'markdown' = 'storage') {
    // v2 API: use body-format param. For markdown, use 'atlas_doc_format' and convert to markdown if needed.
    const params: any = { 'body-format': bodyFormat === 'markdown' ? 'atlas_doc_format' : 'storage' };
    return this.axios.get(`/wiki/api/v2/pages/${pageId}`, { params });
  }

  // Update a page by ID
  async updatePage(pageId: number, data: { title: string; body: string; version: number; status?: string }) {
    const payload: any = {
      id: pageId,
      status: data.status || 'current',
      title: data.title,
      body: { representation: 'storage', value: data.body },
      version: { number: data.version },
    };
    return this.axios.put(`/wiki/api/v2/pages/${pageId}`, payload);
  }

  // List children of a page
  async getChildren(pageId: number) {
    return this.axios.get(`/wiki/api/v2/pages/${pageId}/children`);
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
    const params: any = {};
    if (start !== undefined) params.start = start;
    if (limit !== undefined) params.limit = limit;
    if (keys !== undefined) params.keys = keys;
    return this.axios.get(`/wiki/api/v2/spaces`, { params });
  }

  // Create a new page
  async createPage(spaceId: number, title: string, body: string, parentId?: number) {
    const data: any = {
      spaceId,
      status: 'current',
      title,
      body: { representation: 'storage', value: body },
    };
    if (parentId) {
      data.parentId = parentId;
    }
    return this.axios.post(`/wiki/api/v2/pages`, data);
  }

  // Delete a page by ID
  async deletePage(pageId: number) {
    return this.axios.delete(`/wiki/api/v2/pages/${pageId}`);
  }

  // Advanced search using CQL
  async searchWithCql(cql: string, limit?: number, start?: number) {
    const params: any = { cql };
    if (limit !== undefined) params.limit = limit;
    if (start !== undefined) params.start = start;
    return this.axios.get(`/wiki/rest/api/content/search`, { params });
  }
}