import { ADFDocument, ADFNode } from '../../types/adf.types';
import { adfToPlainText, adfToMarkdown, safeExtractText } from './adfUtils';

// #region ADF (Atlassian Document Format) Utilities
// This file contains utility functions to parse ADF to Markdown or plain text and back.
// Reference: https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/#atlassian-document-format

/**
 * Converts ADF document to Markdown format
 * @param adf - ADF document or node to convert
 * @returns Markdown string representation
 */
export function parseADFToMarkdown(adf: ADFDocument | ADFNode): string {
  if (!adf) return '';
  return adfToMarkdown(adf);
}

/**
 * Converts ADF document to plain text
 * @param adf - ADF document or node to convert
 * @returns Plain text string representation
 */
export function parseADFToPlainText(adf: ADFDocument | ADFNode): string {
  if (!adf) return '';
  return adfToPlainText(adf);
}

//#endregion

/**
 * Enhanced Jira description parser with proper ADF type support
 * Maintains backward compatibility with legacy formats
 */
export function parseJiraDescription(description: unknown): string {
  if (!description) return '';
  
  // Handle plain string descriptions
  if (typeof description === 'string') return description;
  
  // Use safe extraction for type-safe parsing
  return safeExtractText(description);
}

/**
 * Enhanced Jira subtasks parser with type safety
 */
export function parseJiraSubtasks(subtasks: unknown[]): string {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return '';
  
  return subtasks.map(sub => {
    // Type-safe access to subtask properties
    const subtask = sub as { 
      key?: string; 
      fields?: { 
        summary?: string; 
        status?: { name?: string } 
      } 
    };
    
    const summary = subtask.fields?.summary || '';
    const status = subtask.fields?.status?.name || '';
    const key = subtask.key || '';
    
    return `- [${key}] ${summary} (${status})`;
  }).join('\n');
}
