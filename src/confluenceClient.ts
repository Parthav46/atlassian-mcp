import axios, { AxiosInstance } from 'axios';

export interface ConfluenceConfig {
  baseUrl: string;
  userToken: string;
  username: string;
}

export class ConfluenceClient {
  private axios: AxiosInstance;

  constructor(config: ConfluenceConfig) {
    const authString = Buffer.from(`${config.username}:${config.userToken}`).toString('base64');
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
      (error) => {
        if (error.response) {
          console.error('[Confluence API Error]', {
            url: error.config?.url,
            status: error.response.status,
            data: error.response.data,
          });
        } else {
          console.error('[Confluence API Error]', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Get a page by ID (with body, support for storage and markdown)
  async getPage(pageId: string, bodyFormat: 'storage' | 'markdown' = 'storage') {
    // v2 API: use body-format param. For markdown, use 'atlas_doc_format' and convert to markdown if needed.
    const params: any = { 'body-format': bodyFormat === 'markdown' ? 'atlas_doc_format' : 'storage' };
    return this.axios.get(`/wiki/api/v2/pages/${pageId}`, { params });
  }

  // Update a page by ID
  async updatePage(pageId: string, data: any) {
    return this.axios.put(`/wiki/api/v2/pages/${pageId}`, data);
  }

  // List children of a page
  async getChildren(pageId: string) {
    return this.axios.get(`/wiki/api/v2/pages/${pageId}/children`);
  }

  // Get a folder by ID
  async getFolder(folderId: string) {
    return this.axios.get(`/wiki/api/v2/folders/${folderId}`);
  }

  // Get a space by ID
  async getSpace(spaceId: string) {
    return this.axios.get(`/wiki/api/v2/spaces/${spaceId}`);
  }

  // List all spaces
  async listSpaces(start?: number, limit?: number) {
    const params: any = {};
    if (start !== undefined) params.start = start;
    if (limit !== undefined) params.limit = limit;
    return this.axios.get(`/wiki/api/v2/spaces`, { params });
  }

  // Create a new page
  async createPage(spaceId: string, title: string, body: string, parentId?: string) {
    const data: any = {
      spaceId,
      title,
      body: { representation: 'storage', value: body },
    };
    if (parentId) {
      data.parentId = parentId;
    }
    return this.axios.post(`/wiki/api/v2/pages`, data);
  }

  // Delete a page by ID
  async deletePage(pageId: string) {
    return this.axios.delete(`/wiki/api/v2/pages/${pageId}`);
  }

  // Search pages by title
  async searchPagesByTitle(title: string) {
    // Use the widely supported Confluence Cloud REST API endpoint
    return this.axios.get(`/wiki/rest/api/content`, { params: { title } });
  }

  // Get pages from a space (Confluence v2 API)
  async getPagesFromSpace(spaceId: string, limit?: number, cursor?: string) {
    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    if (cursor !== undefined) params.cursor = cursor;
    return this.axios.get(`/wiki/api/v2/spaces/${spaceId}/pages`, { params });
  }

  // Advanced search using CQL
  async searchWithCql(cql: string, limit?: number, start?: number) {
    const params: any = { cql };
    if (limit !== undefined) params.limit = limit;
    if (start !== undefined) params.start = start;
    return this.axios.get(`/wiki/rest/api/content/search`, { params });
  }
}