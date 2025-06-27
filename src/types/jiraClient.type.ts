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