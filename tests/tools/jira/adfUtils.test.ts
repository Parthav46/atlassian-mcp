import { 
  validateADFDocument, 
  adfToPlainText, 
  adfToMarkdown, 
  createSimpleADF, 
  createEmptyADF, 
  createADFParagraph, 
  createADFHeading,
  isEmptyADF,
  safeExtractText
} from '../../../src/tools/jira/adfUtils';
import { 
  ADFDocument, 
  isADFDocument, 
  isADFNode, 
  isADFTextNode, 
  isADFParagraph 
} from '../../../src/types/adf.types';

describe('ADF Type Guards', () => {
  it('isADFDocument validates correct ADF documents', () => {
    const validDoc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: []
    };
    expect(isADFDocument(validDoc)).toBe(true);
    
    const invalidDoc = { type: 'doc', content: [] }; // missing version
    expect(isADFDocument(invalidDoc)).toBe(false);
    
    expect(isADFDocument(null)).toBe(false);
    expect(isADFDocument('string')).toBe(false);
  });

  it('isADFNode validates ADF nodes', () => {
    expect(isADFNode({ type: 'paragraph', content: [] })).toBe(true);
    expect(isADFNode({ type: 'text', text: 'hello' })).toBe(true);
    expect(isADFNode({})).toBe(false);
    expect(isADFNode(null)).toBe(false);
  });

  it('isADFTextNode validates text nodes', () => {
    expect(isADFTextNode({ type: 'text', text: 'hello' })).toBe(true);
    expect(isADFTextNode({ type: 'paragraph', content: [] })).toBe(false);
  });

  it('isADFParagraph validates paragraph nodes', () => {
    expect(isADFParagraph({ type: 'paragraph', content: [] })).toBe(true);
    expect(isADFParagraph({ type: 'text', text: 'hello' })).toBe(false);
  });
});

describe('ADF Validation', () => {
  it('validateADFDocument validates proper ADF documents', () => {
    const validDoc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello world' }
          ]
        }
      ]
    };
    expect(validateADFDocument(validDoc)).toBe(true);
    
    const invalidDoc = { version: 1, type: 'doc', content: 'not an array' };
    expect(validateADFDocument(invalidDoc)).toBe(false);
  });
});

describe('ADF Conversion Functions', () => {
  const sampleADF: ADFDocument = {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'world', marks: [{ type: 'strong' }] }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [
          { type: 'text', text: 'A Heading' }
        ]
      }
    ]
  };

  it('adfToPlainText converts ADF to plain text', () => {
    const result = adfToPlainText(sampleADF);
    expect(result).toBe('Hello world\nA Heading');
  });

  it('adfToMarkdown converts ADF to markdown', () => {
    const result = adfToMarkdown(sampleADF);
    expect(result).toContain('Hello **world**');
    expect(result).toContain('## A Heading');
  });

  it('handles ordered lists in ADF conversion', () => {
    const listADF: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'First item' }]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Second item' }]
                }
              ]
            }
          ]
        }
      ]
    };

    const plainText = adfToPlainText(listADF);
    expect(plainText).toContain('1. First item');
    expect(plainText).toContain('2. Second item');

    const markdown = adfToMarkdown(listADF);
    expect(markdown).toContain('1. First item');
    expect(markdown).toContain('2. Second item');
  });
});

describe('ADF Creation Functions', () => {
  it('createSimpleADF creates ADF from plain text', () => {
    const adf = createSimpleADF('Hello\nWorld');
    expect(adf.version).toBe(1);
    expect(adf.type).toBe('doc');
    expect(adf.content).toHaveLength(2);
    expect(adf.content[0].type).toBe('paragraph');
  });

  it('createEmptyADF creates empty ADF document', () => {
    const adf = createEmptyADF();
    expect(adf.version).toBe(1);
    expect(adf.type).toBe('doc');
    expect(adf.content).toHaveLength(0);
  });

  it('createADFParagraph creates paragraph node', () => {
    const paragraph = createADFParagraph('Hello world');
    expect(paragraph.type).toBe('paragraph');
    expect(paragraph.content).toHaveLength(1);
    expect(paragraph.content?.[0]).toMatchObject({
      type: 'text',
      text: 'Hello world'
    });
  });

  it('createADFHeading creates heading node', () => {
    const heading = createADFHeading('My Heading', 3);
    expect(heading.type).toBe('heading');
    expect(heading.attrs).toEqual({ level: 3 });
    expect(heading.content?.[0]).toMatchObject({
      type: 'text',
      text: 'My Heading'
    });
  });
});

describe('ADF Utility Functions', () => {
  it('isEmptyADF detects empty ADF documents', () => {
    const emptyADF = createEmptyADF();
    expect(isEmptyADF(emptyADF)).toBe(true);

    const nonEmptyADF = createSimpleADF('Hello');
    expect(isEmptyADF(nonEmptyADF)).toBe(false);
  });

  it('safeExtractText handles various input types safely', () => {
    // String input
    expect(safeExtractText('plain string')).toBe('plain string');

    // Valid ADF
    const adf = createSimpleADF('Hello world');
    expect(safeExtractText(adf)).toBe('Hello world');

    // Legacy format (used in existing tests)
    const legacyFormat = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Legacy text' }] }
      ]
    };
    expect(safeExtractText(legacyFormat)).toBe('Legacy text');

    // Invalid input
    expect(safeExtractText(null)).toBe('');
    expect(safeExtractText(undefined)).toBe('');
    expect(safeExtractText(123)).toBe('');
  });

  it('safeExtractText handles complex legacy ADF structures', () => {
    const complexLegacy = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph' }] },
        { 
          type: 'orderedList', 
          content: [
            { 
              type: 'listItem', 
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'List item' }] }
              ] 
            }
          ] 
        }
      ]
    };

    const result = safeExtractText(complexLegacy);
    expect(result).toContain('First paragraph');
    expect(result).toContain('1. List item');
  });
});

describe('Error Handling', () => {
  it('gracefully handles malformed ADF objects', () => {
    const malformed = {
      type: 'doc',
      content: [
        { type: 'paragraph' }, // missing content
        { type: 'unknown-type', content: [] },
        null,
        undefined
      ]
    };

    expect(() => safeExtractText(malformed)).not.toThrow();
    const result = safeExtractText(malformed);
    expect(typeof result).toBe('string');
  });

  it('handles circular references without infinite loops', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const circular: any = { type: 'doc', content: [] };
    circular.content.push(circular);

    expect(() => safeExtractText(circular)).not.toThrow();
    // Should not hang or crash
  });
});