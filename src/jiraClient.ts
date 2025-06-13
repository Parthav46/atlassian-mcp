import axios, { AxiosInstance } from 'axios';

export interface JiraConfig {
  baseUrl: string;
  userToken: string;
}

export class JiraClient {
  private axios: AxiosInstance;

  constructor(config: JiraConfig) {
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
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
