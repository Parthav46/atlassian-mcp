/**
 * ADF (Atlassian Document Format) Utility Functions
 * 
 * This module provides utility functions for working with ADF documents,
 * including validation, conversion, and manipulation functions.
 */

import { 
  ADFDocument, 
  ADFNode, 
  isADFDocument,
  isADFNode,
  isADFTextNode,
  isADFParagraph,
  isADFHeading,
  isADFOrderedList,
  isADFBulletList,
  isADFListItem
} from '../../types/adf.types';

/**
 * Validates if an unknown object is a valid ADF document
 */
export function validateADFDocument(obj: unknown): obj is ADFDocument {
  if (!isADFDocument(obj)) {
    return false;
  }

  // Validate content array
  const doc = obj as ADFDocument;
  if (!Array.isArray(doc.content)) {
    return false;
  }

  // Validate each content node
  return doc.content.every((node: unknown) => isADFNode(node));
}

/**
 * Converts an ADF document to plain text
 */
export function adfToPlainText(adf: ADFDocument | ADFNode): string {
  if (!adf) return '';

  // Handle document root
  if ('version' in adf && adf.type === 'doc') {
    const doc = adf as ADFDocument;
    return doc.content.map((node: ADFNode) => adfToPlainText(node)).join('\n').trim();
  }

  // Handle individual nodes
  const node = adf as ADFNode;
  
  switch (node.type) {
    case 'text':
      return isADFTextNode(node) ? node.text : '';
      
    case 'paragraph':
      if (isADFParagraph(node) && node.content) {
        return node.content.map((child: ADFNode) => adfToPlainText(child)).join('');
      }
      return '';
      
    case 'heading':
      if (isADFHeading(node) && node.content) {
        return node.content.map((child: ADFNode) => adfToPlainText(child)).join('');
      }
      return '';
      
    case 'orderedList':
      if (isADFOrderedList(node) && node.content) {
        return node.content.map((item: ADFNode, idx: number) => {
          const text = adfToPlainText(item);
          return `${idx + 1}. ${text}`;
        }).join('\n');
      }
      return '';
      
    case 'bulletList':
      if (isADFBulletList(node) && node.content) {
        return node.content.map((item: ADFNode) => {
          const text = adfToPlainText(item);
          return `• ${text}`;
        }).join('\n');
      }
      return '';
      
    case 'listItem':
      if (isADFListItem(node) && node.content) {
        return node.content.map((child: ADFNode) => adfToPlainText(child)).join('');
      }
      return '';
      
    case 'codeBlock':
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: ADFNode) => adfToPlainText(child)).join('');
      }
      return '';
      
    case 'blockquote':
      if (node.content && Array.isArray(node.content)) {
        const text = node.content.map((child: ADFNode) => adfToPlainText(child)).join('\n');
        return text.split('\n').map((line: string) => `> ${line}`).join('\n');
      }
      return '';
      
    case 'hardBreak':
      return '\n';
      
    default:
      // Handle unknown node types gracefully  
      if (node.type === 'doc' && node.content && Array.isArray(node.content)) {
        // Special handling for doc nodes without version (legacy format)
        return node.content.map((child: ADFNode) => adfToPlainText(child)).join('\n');
      }
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: ADFNode) => adfToPlainText(child)).join('');
      }
      return '';
  }
}

/**
 * Converts an ADF document to markdown format
 */
export function adfToMarkdown(adf: ADFDocument | ADFNode): string {
  if (!adf) return '';

  // Handle document root
  if ('version' in adf && adf.type === 'doc') {
    const doc = adf as ADFDocument;
    return doc.content.map((node: ADFNode) => adfToMarkdown(node)).join('\n\n').trim();
  }

  // Handle individual nodes
  const node = adf as ADFNode;
  
  switch (node.type) {
    case 'text':
      if (isADFTextNode(node)) {
        let text = node.text;
        
        // Apply marks for markdown formatting
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'strong':
                text = `**${text}**`;
                break;
              case 'em':
                text = `*${text}*`;
                break;
              case 'code':
                text = `\`${text}\``;
                break;
              case 'strike':
                text = `~~${text}~~`;
                break;
              case 'link':
                if (mark.attrs?.href) {
                  text = `[${text}](${mark.attrs.href})`;
                }
                break;
            }
          }
        }
        
        return text;
      }
      return '';
      
    case 'paragraph':
      if (isADFParagraph(node) && node.content) {
        return node.content.map((child: ADFNode) => adfToMarkdown(child)).join('');
      }
      return '';
      
    case 'heading':
      if (isADFHeading(node) && node.content) {
        const text = node.content.map((child: ADFNode) => adfToMarkdown(child)).join('');
        const level = (node.attrs as { level: number }).level || 1;
        return `${'#'.repeat(level)} ${text}`;
      }
      return '';
      
    case 'orderedList':
      if (isADFOrderedList(node) && node.content) {
        return node.content.map((item: ADFNode, idx: number) => {
          const text = adfToMarkdown(item);
          return `${idx + 1}. ${text}`;
        }).join('\n');
      }
      return '';
      
    case 'bulletList':
      if (isADFBulletList(node) && node.content) {
        return node.content.map((item: ADFNode) => {
          const text = adfToMarkdown(item);
          return `- ${text}`;
        }).join('\n');
      }
      return '';
      
    case 'listItem':
      if (isADFListItem(node) && node.content) {
        return node.content.map((child: ADFNode) => adfToMarkdown(child)).join('');
      }
      return '';
      
    case 'codeBlock':
      if (node.content && Array.isArray(node.content)) {
        const code = node.content.map((child: ADFNode) => adfToPlainText(child)).join('');
        const language = (node.attrs as { language?: string })?.language || '';
        return `\`\`\`${language}\n${code}\n\`\`\``;
      }
      return '';
      
    case 'blockquote':
      if (node.content && Array.isArray(node.content)) {
        const text = node.content.map((child: ADFNode) => adfToMarkdown(child)).join('\n');
        return text.split('\n').map((line: string) => `> ${line}`).join('\n');
      }
      return '';
      
    case 'hardBreak':
      return '  \n';
      
    default:
      // Handle unknown node types gracefully
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: ADFNode) => adfToMarkdown(child)).join('');
      }
      return '';
  }
}

/**
 * Creates a simple ADF document from plain text
 */
export function createSimpleADF(text: string): ADFDocument {
  if (!text || typeof text !== 'string') {
    return createEmptyADF();
  }

  const paragraphs = text.split('\n').filter(line => line.trim()).map(line => 
    createADFParagraph(line.trim())
  );

  return {
    version: 1,
    type: 'doc',
    content: paragraphs
  };
}

/**
 * Creates an empty ADF document
 */
export function createEmptyADF(): ADFDocument {
  return {
    version: 1,
    type: 'doc',
    content: []
  };
}

/**
 * Creates an ADF paragraph with plain text
 */
export function createADFParagraph(text: string): ADFNode {
  return {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: text
      }
    ]
  };
}

/**
 * Creates an ADF heading
 */
export function createADFHeading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1): ADFNode {
  return {
    type: 'heading',
    attrs: { level },
    content: [
      {
        type: 'text',
        text: text
      }
    ]
  };
}

/**
 * Checks if an ADF document is empty (has no meaningful content)
 */
export function isEmptyADF(adf: ADFDocument): boolean {
  if (!adf || !Array.isArray(adf.content)) {
    return true;
  }

  return adf.content.length === 0 || adfToPlainText(adf).trim() === '';
}

/**
 * Safely extracts text content from potentially malformed ADF
 */
export function safeExtractText(obj: unknown, visited: WeakSet<object> = new WeakSet()): string {
  try {
    if (typeof obj === 'string') {
      return obj;
    }
    
    // Protect against circular references
    if (typeof obj === 'object' && obj !== null) {
      if (visited.has(obj)) {
        return '';
      }
      visited.add(obj);
    }

    if (validateADFDocument(obj)) {
      return adfToPlainText(obj);
    }

    if (isADFNode(obj)) {
      return adfToPlainText(obj);
    }

    // Fallback for legacy/malformed ADF objects
    if (typeof obj === 'object' && obj !== null) {
      const legacyObj = obj as { type?: string; content?: unknown[] };
      if (legacyObj.type === 'doc' && Array.isArray(legacyObj.content)) {
        // For legacy doc format, parse each content item properly
        const results = legacyObj.content.map((item: unknown) => {
          if (typeof item === 'object' && item !== null) {
            const itemObj = item as { type?: string; content?: unknown[] };
            if (itemObj.type === 'paragraph' && Array.isArray(itemObj.content)) {
              return itemObj.content.map((textItem: unknown) => {
                if (typeof textItem === 'object' && textItem !== null) {
                  const textObj = textItem as { type?: string; text?: string };
                  if (textObj.type === 'text' && typeof textObj.text === 'string') {
                    return textObj.text;
                  }
                }
                return '';
              }).join('');
            }
            if (itemObj.type === 'orderedList' && Array.isArray(itemObj.content)) {
              return itemObj.content.map((listItem: unknown, idx: number) => {
                if (typeof listItem === 'object' && listItem !== null) {
                  const listItemObj = listItem as { type?: string; content?: unknown[] };
                  if (listItemObj.type === 'listItem' && Array.isArray(listItemObj.content)) {
                    const text = listItemObj.content.map((c: unknown) => safeExtractText(c, visited)).join('');
                    return `${idx + 1}. ${text}`;
                  }
                }
                return '';
              }).join('\n');
            }
            // For individual nodes, check what they are
            if (typeof itemObj.type === 'string') {
              return '';  // Don't process unknown types to avoid infinite recursion
            }
            return '';
          }
          return '';
        });
        return results.filter(text => text.trim()).join('\n');
      }
      
      // Handle individual paragraph nodes
      const itemObj = obj as { type?: string; content?: unknown[] };
      if (itemObj.type === 'paragraph' && Array.isArray(itemObj.content)) {
        return itemObj.content.map((textItem: unknown) => {
          if (typeof textItem === 'object' && textItem !== null) {
            const textObj = textItem as { type?: string; text?: string };
            if (textObj.type === 'text' && typeof textObj.text === 'string') {
              return textObj.text;
            }
          }
          return '';
        }).join('');
      }
    }

    return '';
  } catch (error) {
    console.warn('Error extracting text from ADF object:', error);
    return '';
  }
}