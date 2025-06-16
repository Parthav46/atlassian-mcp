import axios, { AxiosInstance } from 'axios';

export interface JiraConfig {
  baseUrl: string;
  token: string;
  username: string;
}

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

  constructor(config: JiraConfig) {
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
  async searchIssues({
    jql,
    nextPageToken,
    maxResults,
    fields,
    expand,
    properties,
    fieldsByKeys,
    failFast,
    reconcileIssues
  }: {
    jql: string;
    nextPageToken?: string;
    maxResults?: number;
    fields?: string[];
    expand?: string;
    properties?: string[];
    fieldsByKeys?: boolean;
    failFast?: boolean;
    reconcileIssues?: number[];
  }) {
    const params: Record<string, any> = { jql };
    if (nextPageToken) params.nextPageToken = nextPageToken;
    if (typeof maxResults === 'number') params.maxResults = maxResults;
    if (fields && fields.length) params.fields = fields.join(',');
    if (expand) params.expand = expand;
    if (properties && properties.length) params.properties = properties.join(',');
    if (typeof fieldsByKeys === 'boolean') params.fieldsByKeys = fieldsByKeys;
    if (typeof failFast === 'boolean') params.failFast = failFast;
    if (reconcileIssues && reconcileIssues.length) params.reconcileIssues = reconcileIssues.join(',');
    return this.axios.get(`/rest/api/3/search/jql`, { params });
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
