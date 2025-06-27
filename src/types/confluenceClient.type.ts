//#region Confluence Pages
type PageBodyWrite = {
  representation: 'storage' | 'atlas_doc_format' | 'wiki';
  value: string;
}

export type GetPageRequest = {
  id: string;
  "body-format"?: 'storage' | 'atlas_doc_format' | 'wiki';
  "include-ancestors"?: boolean;
  "include-direct-children"?: boolean;
  "include-version"?: boolean;
  "include-history"?: boolean;
}

export type CreatePageRequest = {
  spaceId: string;
  title: string;
  parentId?: string;
  status?: 'current' | 'draft';
  body: PageBodyWrite;
}

export type UpdatePageRequest = {
  id: string;
  title: string;
  body: PageBodyWrite;
  version: {
    number: number;
    minorEdit?: boolean;
    message?: string;
  };
  status?: 'current' | 'draft';
}

export type Page = {
  id: string;
  title: string;
  type: string;
  status: string;
  parentId?: string;
  parentType?: string;
  version: {
    number: number;
    minorEdit?: boolean;
    message?: string;
    createdAt?: string;
  }
  body?: {
    storage?: PageBodyWrite;
    atlas_doc_format?: PageBodyWrite;
    wiki?: PageBodyWrite;
  }
  _links?: {
    base: string;
    webui?: string;
  }
}
//#endregion

//#region CQL Search
export type CqlResult = {
  results: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    _expandable: {
      space: string;
      version: string;
      body: string;
      history: string;
      container: string;
      operations: string;
      metadata: string;
      children: string;
      ancestors: string;
    };
    _links: {
      self: string;
      webui?: string;
    };
  }>;
}

export type CqlSearchParams = {
  cql: string;
  limit?: number;
  start?: number;
}
//#endregion