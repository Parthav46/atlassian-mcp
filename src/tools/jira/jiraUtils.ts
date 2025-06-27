/* eslint-disable @typescript-eslint/no-explicit-any */
// This file contains utility functions to parse Jira issue fields and descriptions. Suppressing errors for dynamic fields until the feature for ADF parsing is implemented.

// #region ADF (Atlassian Document Format) Utilities
// This file contains utility functions to parse ADF to Markdown or plain text and back.
// Reference: https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/#atlassian-document-format

export function parseADFToMarkdown(): string {
  // Implement ADF to Markdown conversion logic here
  return '';
}

//#endregion

export function parseJiraDescription(description: any): string {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (description.type === 'doc' && Array.isArray(description.content)) {
    const parseContent = (contentArr: any[]): string => {
      return contentArr.map(block => {
        if (block.type === 'paragraph' && Array.isArray(block.content)) {
          return block.content.map((c: any) => c.text || '').join('');
        }
        if (block.type === 'orderedList' && Array.isArray(block.content)) {
          return block.content.map((item: any, idx: number) => {
            const text = item.content ? parseContent(item.content) : '';
            return `${idx + 1}. ${text}`;
          }).join('\n');
        }
        if (block.type === 'listItem' && Array.isArray(block.content)) {
          return block.content.map((c: any) => parseContent([c])).join('');
        }
        return '';
      }).join('\n');
    };
    return parseContent(description.content);
  }
  return '';
}

export function parseJiraSubtasks(subtasks: any[]): string {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return '';
  return subtasks.map(sub => {
    const summary = sub.fields?.summary || '';
    const status = sub.fields?.status?.name || '';
    const key = sub.key;
    return `- [${key}] ${summary} (${status})`;
  }).join('\n');
}
