import axios, { AxiosInstance } from 'axios';
import { ConfluenceConfig } from '../config/confluence';

export class ConfluenceClient {
  private axios: AxiosInstance;

  constructor(config: ConfluenceConfig) {
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  // Get a page by ID
  async getPage(pageId: string) {
    return this.axios.get(`/wiki/api/v2/pages/${pageId}`);
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
    return this.axios.get(`/wiki/api/v2/pages`, { params: { title } });
  }
}