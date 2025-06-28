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
import type { ADFDocument, ADFNode } from './adf.types';

export type JiraIssueRequest = {
  fields: {
    project: {
      id: string;
    };
    parent?: {
      key: string;
    };
    summary: string;
    description?: ADFDocument | {
      type: string; // e.g., "doc"
      content?: ADFNode[]; // ADF content with proper typing
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