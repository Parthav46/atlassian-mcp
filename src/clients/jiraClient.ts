import axios, { AxiosInstance } from 'axios';
import { AtlassianConfig } from './atlassianConfig';
import type { JqlResult, JqlSearchParams } from '../types/jiraClient.type';

export function jiraErrorHandler(error: any) {
  if (error.response) {
    console.error('[Jira API Error]', {
      url: error.config?.url,
      status: error.response.status,
      data: JSON.stringify(error.response.data, null, 2),
    });
  } else {
    console.error('[Jira API Error]', error.message);
  }
  return Promise.reject(error);
}

export class JiraClient {
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
      jiraErrorHandler
    );
  }

  // Search Jira issues (JQL)
  async searchIssues(data: JqlSearchParams) {
    return this.axios.get<JqlResult>(`/rest/api/3/search/jql`, { data });
  }

  // Get a Jira issue by key
  async getIssue(issueKey: string) {
    return this.axios.get(`/rest/api/3/issue/${issueKey}`);
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
