//#region JQL Search
export type JqlSearchParams = {
  jql: string;
  nextPageToken?: string;
  maxResults?: number;
  fields?: string[];
  expand?: string;
  properties?: string[];
  fieldsByKeys?: boolean;
  failFast?: boolean;
  reconcileIssues?: number[];
};

export type JqlResult = {
  isLast: boolean;
  nextPageToken?: string;
  issues: Array<{
    id: string;
    key?: string;
    expand?: string;
    // Suppressing lint as fields can be dynamic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields?: Record<string, any>;
  }>;
};
//#endregion
//#region Jira Issue
export type JiraIssueRequest = {
  fields: {
    project: {
      id: string;
    };
    parent?: {
      key: string;
    };
    summary: string;
    description?: {
      type: string; // e.g., "doc"
      // Suppressing lint as content can be dynamic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content?: any[]; // ADF content
      version?: number;
    };
    issuetype: {
      id: string;
    };
    // Suppressing lint as fields can be dynamic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  update?: object;
  // Suppressing lint as request properties can be dynamic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type CreateJiraIssueResponse = {
  id: string;
  key: string;
  self: string;
  transitions: {
    status: number;
    errorCollection: {
      errorMessages: string[];
      errors: Record<string, string>;
    }
  }
}
//#endregion