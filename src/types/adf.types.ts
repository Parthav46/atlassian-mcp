/**
 * Atlassian Document Format (ADF) Type Definitions
 * 
 * Lightweight type definitions for ADF documents based on the official
 * Atlassian Document Format specification.
 * 
 * Reference: https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/#atlassian-document-format
 */

/**
 * Base ADF node interface that all content nodes extend
 */
export interface ADFNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ADFNode[];
  marks?: ADFMark[];
  text?: string;
}

/**
 * ADF mark interface for text formatting
 */
export interface ADFMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Root ADF document structure
 */
export interface ADFDocument {
  version: 1;
  type: 'doc';
  content: ADFNode[];
}

/**
 * ADF paragraph node
 */
export interface ADFParagraph extends ADFNode {
  type: 'paragraph';
  content: (ADFText | ADFInlineNode)[];
}

/**
 * ADF text node with optional formatting marks
 */
export interface ADFText extends ADFNode {
  type: 'text';
  text: string;
  marks?: ADFMark[];
}

/**
 * ADF heading node
 */
export interface ADFHeading extends ADFNode {
  type: 'heading';
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
  content: (ADFText | ADFInlineNode)[];
}

/**
 * ADF ordered list node
 */
export interface ADFOrderedList extends ADFNode {
  type: 'orderedList';
  attrs?: {
    order?: number;
  };
  content: ADFListItem[];
}

/**
 * ADF bullet list node
 */
export interface ADFBulletList extends ADFNode {
  type: 'bulletList';
  content: ADFListItem[];
}

/**
 * ADF list item node
 */
export interface ADFListItem extends ADFNode {
  type: 'listItem';
  content: (ADFParagraph | ADFOrderedList | ADFBulletList)[];
}

/**
 * ADF code block node
 */
export interface ADFCodeBlock extends ADFNode {
  type: 'codeBlock';
  attrs?: {
    language?: string;
  };
  content: ADFText[];
}

/**
 * ADF blockquote node
 */
export interface ADFBlockquote extends ADFNode {
  type: 'blockquote';
  content: (ADFParagraph | ADFOrderedList | ADFBulletList)[];
}

/**
 * ADF hard break node
 */
export interface ADFHardBreak extends ADFNode {
  type: 'hardBreak';
}

/**
 * Union type for inline nodes that can appear within paragraphs
 */
export type ADFInlineNode = ADFHardBreak | ADFMentionNode | ADFLinkNode;

/**
 * ADF mention node for @mentions
 */
export interface ADFMentionNode extends ADFNode {
  type: 'mention';
  attrs: {
    id: string;
    text?: string;
    userType?: string;
  };
}

/**
 * ADF link node
 */
export interface ADFLinkNode extends ADFNode {
  type: 'text';
  text: string;
  marks: Array<{
    type: 'link';
    attrs: {
      href: string;
      title?: string;
    };
  }>;
}

/**
 * Union type for all block-level nodes
 */
export type ADFBlockNode = 
  | ADFParagraph 
  | ADFHeading 
  | ADFOrderedList 
  | ADFBulletList 
  | ADFCodeBlock 
  | ADFBlockquote;

/**
 * Common ADF mark types
 */
export type ADFMarkType = 
  | 'strong' 
  | 'em' 
  | 'code' 
  | 'strike' 
  | 'underline' 
  | 'link' 
  | 'textColor' 
  | 'subsup';

/**
 * Type guard to check if an object is an ADF document
 */
export function isADFDocument(obj: unknown): obj is ADFDocument {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    'type' in obj &&
    'content' in obj &&
    (obj as ADFDocument).version === 1 &&
    (obj as ADFDocument).type === 'doc' &&
    Array.isArray((obj as ADFDocument).content)
  );
}

/**
 * Type guard to check if an object is an ADF node
 */
export function isADFNode(obj: unknown): obj is ADFNode {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    typeof (obj as ADFNode).type === 'string'
  );
}

/**
 * Type guard to check if an ADF node is a text node
 */
export function isADFTextNode(node: ADFNode): node is ADFText {
  return node.type === 'text' && typeof (node as ADFText).text === 'string';
}

/**
 * Type guard to check if an ADF node is a paragraph
 */
export function isADFParagraph(node: ADFNode): node is ADFParagraph {
  return node.type === 'paragraph' && Array.isArray(node.content);
}

/**
 * Type guard to check if an ADF node is a heading
 */
export function isADFHeading(node: ADFNode): node is ADFHeading {
  return node.type === 'heading' && node.attrs != null && typeof (node.attrs as { level?: number }).level === 'number';
}

/**
 * Type guard to check if an ADF node is an ordered list
 */
export function isADFOrderedList(node: ADFNode): node is ADFOrderedList {
  return node.type === 'orderedList' && Array.isArray(node.content);
}

/**
 * Type guard to check if an ADF node is a bullet list
 */
export function isADFBulletList(node: ADFNode): node is ADFBulletList {
  return node.type === 'bulletList' && Array.isArray(node.content);
}

/**
 * Type guard to check if an ADF node is a list item
 */
export function isADFListItem(node: ADFNode): node is ADFListItem {
  return node.type === 'listItem' && Array.isArray(node.content);
}