import { 
  ADFDocument, 
  ADFNode, 
  ADFText, 
  ADFParagraph, 
  ADFHeading,
  ADFOrderedList,
  ADFBulletList,
  ADFListItem,
  isADFDocument,
  isADFNode,
  isADFTextNode,
  isADFParagraph,
  isADFHeading,
  isADFOrderedList,
  isADFBulletList,
  isADFListItem
} from '../../src/types/adf.types';

describe('ADF Type Definitions', () => {
  it('should define proper ADFDocument structure', () => {
    const doc: ADFDocument = {
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

    expect(doc.version).toBe(1);
    expect(doc.type).toBe('doc');
    expect(Array.isArray(doc.content)).toBe(true);
  });

  it('should define proper ADFText structure', () => {
    const textNode: ADFText = {
      type: 'text',
      text: 'Hello world',
      marks: [
        { type: 'strong' },
        { type: 'em', attrs: { color: 'red' } }
      ]
    };

    expect(textNode.type).toBe('text');
    expect(textNode.text).toBe('Hello world');
    expect(textNode.marks).toHaveLength(2);
  });

  it('should define proper ADFParagraph structure', () => {
    const paragraph: ADFParagraph = {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Paragraph text' },
        { type: 'hardBreak' }
      ]
    };

    expect(paragraph.type).toBe('paragraph');
    expect(Array.isArray(paragraph.content)).toBe(true);
  });

  it('should define proper ADFHeading structure', () => {
    const heading: ADFHeading = {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        { type: 'text', text: 'Heading text' }
      ]
    };

    expect(heading.type).toBe('heading');
    expect(heading.attrs.level).toBe(2);
  });

  it('should define proper list structures', () => {
    const orderedList: ADFOrderedList = {
      type: 'orderedList',
      attrs: { order: 1 },
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'First item' }]
            }
          ]
        }
      ]
    };

    const bulletList: ADFBulletList = {
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
    };

    expect(orderedList.type).toBe('orderedList');
    expect(bulletList.type).toBe('bulletList');
  });
});

describe('ADF Type Guards', () => {
  const validDocument: ADFDocument = {
    version: 1,
    type: 'doc',
    content: []
  };

  const validNode: ADFNode = {
    type: 'paragraph',
    content: []
  };

  const textNode: ADFText = {
    type: 'text',
    text: 'Hello'
  };

  const paragraphNode: ADFParagraph = {
    type: 'paragraph',
    content: [textNode]
  };

  const headingNode: ADFHeading = {
    type: 'heading',
    attrs: { level: 1 },
    content: [textNode]
  };

  const orderedListNode: ADFOrderedList = {
    type: 'orderedList',
    content: []
  };

  const bulletListNode: ADFBulletList = {
    type: 'bulletList',
    content: []
  };

  const listItemNode: ADFListItem = {
    type: 'listItem',
    content: []
  };

  it('isADFDocument should correctly identify ADF documents', () => {
    expect(isADFDocument(validDocument)).toBe(true);
    expect(isADFDocument(validNode)).toBe(false);
    expect(isADFDocument({ type: 'doc', content: [] })).toBe(false); // missing version
    expect(isADFDocument({ version: 1, content: [] })).toBe(false); // missing type
    expect(isADFDocument(null)).toBe(false);
    expect(isADFDocument(undefined)).toBe(false);
    expect(isADFDocument('string')).toBe(false);
  });

  it('isADFNode should correctly identify ADF nodes', () => {
    expect(isADFNode(validNode)).toBe(true);
    expect(isADFNode(textNode)).toBe(true);
    expect(isADFNode(paragraphNode)).toBe(true);
    expect(isADFNode({})).toBe(false); // missing type
    expect(isADFNode({ type: 123 })).toBe(false); // type not string
    expect(isADFNode(null)).toBe(false);
    expect(isADFNode(undefined)).toBe(false);
  });

  it('isADFTextNode should correctly identify text nodes', () => {
    expect(isADFTextNode(textNode)).toBe(true);
    expect(isADFTextNode(paragraphNode)).toBe(false);
    expect(isADFTextNode({ type: 'text' })).toBe(false); // missing text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isADFTextNode({ type: 'text', text: 123 } as any)).toBe(false); // text not string
  });

  it('isADFParagraph should correctly identify paragraph nodes', () => {
    expect(isADFParagraph(paragraphNode)).toBe(true);
    expect(isADFParagraph(textNode)).toBe(false);
    expect(isADFParagraph({ type: 'paragraph' })).toBe(false); // missing content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isADFParagraph({ type: 'paragraph', content: 'not array' } as any)).toBe(false);
  });

  it('isADFHeading should correctly identify heading nodes', () => {
    expect(isADFHeading(headingNode)).toBe(true);
    expect(isADFHeading(paragraphNode)).toBe(false);
    expect(isADFHeading({ type: 'heading' })).toBe(false); // missing attrs
    expect(isADFHeading({ type: 'heading', attrs: {} })).toBe(false); // missing level
    expect(isADFHeading({ type: 'heading', attrs: { level: 'not number' } })).toBe(false);
  });

  it('isADFOrderedList should correctly identify ordered list nodes', () => {
    expect(isADFOrderedList(orderedListNode)).toBe(true);
    expect(isADFOrderedList(bulletListNode)).toBe(false);
    expect(isADFOrderedList({ type: 'orderedList' })).toBe(false); // missing content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isADFOrderedList({ type: 'orderedList', content: 'not array' } as any)).toBe(false);
  });

  it('isADFBulletList should correctly identify bullet list nodes', () => {
    expect(isADFBulletList(bulletListNode)).toBe(true);
    expect(isADFBulletList(orderedListNode)).toBe(false);
    expect(isADFBulletList({ type: 'bulletList' })).toBe(false); // missing content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isADFBulletList({ type: 'bulletList', content: 'not array' } as any)).toBe(false);
  });

  it('isADFListItem should correctly identify list item nodes', () => {
    expect(isADFListItem(listItemNode)).toBe(true);
    expect(isADFListItem(paragraphNode)).toBe(false);
    expect(isADFListItem({ type: 'listItem' })).toBe(false); // missing content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isADFListItem({ type: 'listItem', content: 'not array' } as any)).toBe(false);
  });
});

describe('Type Safety', () => {
  it('should provide proper TypeScript type checking', () => {
    // This test validates that the types compile correctly
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello',
              marks: [
                { type: 'strong' },
                { type: 'link', attrs: { href: 'https://example.com' } }
              ]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [
            { type: 'text', text: 'Heading' }
          ]
        }
      ]
    };

    // Type assertions should work
    expect(doc.version).toBe(1);
    expect(doc.type).toBe('doc');
    
    const firstNode = doc.content[0];
    if (isADFParagraph(firstNode)) {
      expect(firstNode.type).toBe('paragraph');
      const firstChild = firstNode.content[0];
      if (isADFTextNode(firstChild)) {
        expect(firstChild.text).toBe('Hello');
      }
    }
  });
});