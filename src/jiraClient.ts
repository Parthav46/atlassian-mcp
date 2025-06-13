import axios, { AxiosInstance } from 'axios';

export interface JiraConfig {
  baseUrl: string;
  userToken: string;
  username: string;
}

export class JiraClient {
  private axios: AxiosInstance;

  constructor(config: JiraConfig) {
    const authString = Buffer.from(`${config.username}:${config.userToken}`).toString('base64');
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request logging
    this.axios.interceptors.request.use((request) => {
      const url = (request.baseURL || '') + request.url;
      let dataPreview = '';
      if (typeof request.data === 'string') {
        dataPreview = request.data.slice(0, 100);
      } else if (typeof request.data === 'object' && request.data !== null) {
        dataPreview = JSON.stringify(request.data).slice(0, 100);
      }
      console.log('[Jira API Request]', {
        url,
        method: request.method,
        headers: request.headers,
        dataPreview,
      });
      return request;
    });

    // Add response logging
    this.axios.interceptors.response.use((response) => {
      let dataPreview = '';
      if (typeof response.data === 'string') {
        dataPreview = response.data.slice(0, 100);
      } else if (typeof response.data === 'object' && response.data !== null) {
        dataPreview = JSON.stringify(response.data).slice(0, 100);
      }
      console.log('[Jira API Response]', {
        url: (response.config.baseURL || '') + response.config.url,
        status: response.status,
        dataPreview,
      });
      return response;
    });
  }

  // Get a Jira issue by key
  async getIssue(issueKey: string) {
    return this.axios.get(`/rest/api/3/issue/${issueKey}`);
  }

  // Search Jira issues (JQL)
  async searchIssues(jql: string, startAt?: number, maxResults?: number) {
    return this.axios.get(`/rest/api/3/search`, {
      params: { jql, startAt, maxResults },
    });
  }

  // Create a Jira issue
  async createIssue(issueData: any) {
    return this.axios.post(`/rest/api/3/issue`, issueData);
  }

  // Update a Jira issue
  async updateIssue(issueKey: string, issueData: any) {
    return this.axios.put(`/rest/api/3/issue/${issueKey}`, issueData);
  }

  // Delete a Jira issue
  async deleteIssue(issueKey: string) {
    return this.axios.delete(`/rest/api/3/issue/${issueKey}`);
  }
}
