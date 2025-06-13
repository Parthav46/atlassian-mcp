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
}