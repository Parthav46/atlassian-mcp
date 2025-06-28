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
  ADFNode,
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

  it('handles bullet lists in ADF conversion', () => {
    const listADF: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Bullet item' }]
                }
              ]
            }
          ]
        }
      ]
    };

    const plainText = adfToPlainText(listADF);
    expect(plainText).toContain('• Bullet item');

    const markdown = adfToMarkdown(listADF);
    expect(markdown).toContain('- Bullet item');
  });

  it('handles code blocks in ADF conversion', () => {
    const codeADF: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'javascript' },
          content: [
            { type: 'text', text: 'console.log("hello");' }
          ]
        }
      ]
    };

    const plainText = adfToPlainText(codeADF);
    expect(plainText).toBe('console.log("hello");');

    const markdown = adfToMarkdown(codeADF);
    expect(markdown).toContain('```javascript\nconsole.log("hello");\n```');
  });

  it('handles code blocks without language attribute', () => {
    const codeADF: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          content: [
            { type: 'text', text: 'some code' }
          ]
        }
      ]
    };

    const markdown = adfToMarkdown(codeADF);
    expect(markdown).toContain('```\nsome code\n```');
  });

  it('handles blockquotes in ADF conversion', () => {
    const quoteADF: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'This is a quote' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Second line' }]
            }
          ]
        }
      ]
    };

    const plainText = adfToPlainText(quoteADF);
    expect(plainText).toContain('> This is a quote');
    expect(plainText).toContain('> Second line');

    const markdown = adfToMarkdown(quoteADF);
    expect(markdown).toContain('> This is a quote');
    expect(markdown).toContain('> Second line');
  });

  it('handles hard breaks in ADF conversion', () => {
    const breakADF: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Line 1' },
            { type: 'hardBreak' },
            { type: 'text', text: 'Line 2' }
          ]
        }
      ]
    };

    const plainText = adfToPlainText(breakADF);
    expect(plainText).toBe('Line 1\nLine 2');

    const markdown = adfToMarkdown(breakADF);
    expect(markdown).toBe('Line 1  \nLine 2');
  });

  it('handles text marks in markdown conversion', () => {
    const markedADF: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { 
              type: 'text', 
              text: 'bold text',
              marks: [{ type: 'strong' }]
            },
            { type: 'text', text: ' and ' },
            { 
              type: 'text', 
              text: 'italic text',
              marks: [{ type: 'em' }]
            },
            { type: 'text', text: ' and ' },
            { 
              type: 'text', 
              text: 'code text',
              marks: [{ type: 'code' }]
            },
            { type: 'text', text: ' and ' },
            { 
              type: 'text', 
              text: 'strikethrough',
              marks: [{ type: 'strike' }]
            },
            { type: 'text', text: ' and ' },
            { 
              type: 'text', 
              text: 'link text',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }]
            }
          ]
        }
      ]
    };

    const markdown = adfToMarkdown(markedADF);
    expect(markdown).toContain('**bold text**');
    expect(markdown).toContain('*italic text*');
    expect(markdown).toContain('`code text`');
    expect(markdown).toContain('~~strikethrough~~');
    expect(markdown).toContain('[link text](https://example.com)');
  });

  it('handles unknown node types gracefully', () => {
    const unknownADF = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'unknownType',
          content: [
            { type: 'text', text: 'Some text' }
          ]
        }
      ]
    } as ADFDocument;

    const plainText = adfToPlainText(unknownADF);
    expect(plainText).toBe('Some text');

    const markdown = adfToMarkdown(unknownADF);
    expect(markdown).toBe('Some text');
  });

  it('handles nodes without content arrays', () => {
    const noContentADF = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph'
        }
      ]
    } as ADFDocument;

    const plainText = adfToPlainText(noContentADF);
    expect(plainText).toBe('');

    const markdown = adfToMarkdown(noContentADF);
    expect(markdown).toBe('');
  });

  it('handles empty or null input', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect(adfToPlainText(null as any)).toBe('');
    expect(adfToPlainText(undefined as any)).toBe('');
    expect(adfToMarkdown(null as any)).toBe('');
    expect(adfToMarkdown(undefined as any)).toBe('');
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it('handles legacy doc format without version', () => {
    const legacyDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Legacy content' }]
        }
      ]
    } as ADFNode;

    const plainText = adfToPlainText(legacyDoc);
    expect(plainText).toBe('Legacy content');

    const markdown = adfToMarkdown(legacyDoc);
    expect(markdown).toBe('Legacy content');
  });

  it('handles heading without attrs', () => {
    // This test verifies that headings without proper validation fail gracefully
    const headingADF = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'heading',
          content: [{ type: 'text', text: 'No level heading' }]
        }
      ]
    } as ADFDocument;

    // Without proper attrs, isADFHeading returns false, so text processing fails
    const plainText = adfToPlainText(headingADF);
    expect(plainText).toBe('');

    const markdown = adfToMarkdown(headingADF);
    expect(markdown).toBe('');
  });

  it('handles text node without isADFTextNode validation', () => {
    const textNode = {
      type: 'text'
      // missing text property
    } as ADFNode;

    const plainText = adfToPlainText(textNode);
    expect(plainText).toBe('');

    const markdown = adfToMarkdown(textNode);
    expect(markdown).toBe('');
  });

  it('handles paragraph node without isADFParagraph validation', () => {
    const paragraphNode = {
      type: 'paragraph'
      // missing content property
    } as ADFNode;

    const plainText = adfToPlainText(paragraphNode);
    expect(plainText).toBe('');

    const markdown = adfToMarkdown(paragraphNode);
    expect(markdown).toBe('');
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

  it('createSimpleADF handles empty string', () => {
    const adf = createSimpleADF('');
    expect(adf.version).toBe(1);
    expect(adf.type).toBe('doc');
    expect(adf.content).toHaveLength(0);
  });

  it('createSimpleADF handles null/undefined input', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const adf1 = createSimpleADF(null as any);
    const adf2 = createSimpleADF(undefined as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    
    expect(adf1.version).toBe(1);
    expect(adf1.type).toBe('doc');
    expect(adf1.content).toHaveLength(0);
    
    expect(adf2.version).toBe(1);
    expect(adf2.type).toBe('doc');
    expect(adf2.content).toHaveLength(0);
  });

  it('createSimpleADF handles non-string input', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const adf = createSimpleADF(123 as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    
    expect(adf.version).toBe(1);
    expect(adf.type).toBe('doc');
    expect(adf.content).toHaveLength(0);
  });

  it('createSimpleADF filters out empty lines', () => {
    const adf = createSimpleADF('Hello\n\n\nWorld\n  \n');
    expect(adf.version).toBe(1);
    expect(adf.type).toBe('doc');
    expect(adf.content).toHaveLength(2);
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

  it('createADFHeading uses default level when not specified', () => {
    const heading = createADFHeading('Default Level');
    expect(heading.type).toBe('heading');
    expect(heading.attrs).toEqual({ level: 1 });
    expect(heading.content?.[0]).toMatchObject({
      type: 'text',
      text: 'Default Level'
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

  it('isEmptyADF handles null/undefined input', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect(isEmptyADF(null as any)).toBe(true);
    expect(isEmptyADF(undefined as any)).toBe(true);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it('isEmptyADF handles ADF with non-array content', () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const invalidADF = { version: 1, type: 'doc', content: 'not an array' } as any;
    expect(isEmptyADF(invalidADF)).toBe(true);
  });

  it('isEmptyADF detects ADF with only whitespace', () => {
    const whitespaceADF = createSimpleADF('   \n  \t  ');
    expect(isEmptyADF(whitespaceADF)).toBe(true);
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

  it('safeExtractText handles individual paragraph nodes', () => {
    const paragraphNode = {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Just a paragraph' }
      ]
    };

    const result = safeExtractText(paragraphNode);
    expect(result).toBe('Just a paragraph');
  });

  it('safeExtractText handles malformed paragraph nodes', () => {
    const malformedParagraph = {
      type: 'paragraph',
      content: [
        { type: 'text' }, // missing text property
        { type: 'text', text: 'valid text' },
        { type: 'nottext', text: 'wrong type' }
      ]
    };

    const result = safeExtractText(malformedParagraph);
    expect(result).toBe('valid text');
  });

  it('safeExtractText handles valid ADF nodes', () => {
    const validNode: ADFNode = {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Valid node text' }
      ]
    };

    const result = safeExtractText(validNode);
    expect(result).toBe('Valid node text');
  });

  it('safeExtractText handles objects that are neither ADF documents nor nodes', () => {
    const randomObject = {
      someProperty: 'value',
      anotherProperty: 123
    };

    const result = safeExtractText(randomObject);
    expect(result).toBe('');
  });

  it('safeExtractText handles legacy doc with complex nested structures', () => {
    const complexDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Normal ' },
            { type: 'nottext', invalid: 'data' }
          ]
        }
      ]
    };

    const result = safeExtractText(complexDoc);
    expect(result).toContain('Normal ');
    expect(result).not.toContain('invalid');
    expect(result).not.toContain('data');
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
    // Create a simple test that will be caught by the error handler
    // instead of actually creating circular references
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    
    // Force an error by calling with a structure that causes maximum call stack
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const circular: any = { type: 'doc', content: [] };
    circular.content.push(circular);

    expect(() => safeExtractText(circular)).not.toThrow();
    const result = safeExtractText(circular);
    expect(typeof result).toBe('string');
    
    // Should have logged a warning about the error
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Error extracting text from ADF object:',
      expect.any(Error)
    );
    
    mockConsoleWarn.mockRestore();
  });

  it('validateADFDocument handles invalid content types', () => {
    const invalidDoc = {
      version: 1,
      type: 'doc',
      content: [
        { type: 'paragraph', content: [] },
        'invalid node', // string instead of object
        { notType: 'missing type property' },
        null
      ]
    };

    expect(validateADFDocument(invalidDoc)).toBe(false);
  });

  it('validateADFDocument handles non-array content', () => {
    const invalidDoc = {
      version: 1,
      type: 'doc',
      content: 'not an array'
    };

    expect(validateADFDocument(invalidDoc)).toBe(false);
  });
});