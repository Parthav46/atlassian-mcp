import { parseJiraDescription, parseJiraSubtasks } from '../../../src/tools/jira/jiraUtils';

describe('parseJiraDescription', () => {
  it('returns empty string for undefined/null/empty', () => {
    expect(parseJiraDescription(undefined)).toBe('');
    expect(parseJiraDescription(null)).toBe('');
    expect(parseJiraDescription('')).toBe('');
  });

  it('returns string as-is for plain string', () => {
    expect(parseJiraDescription('plain text')).toBe('plain text');
  });

  it('parses Atlassian doc format with paragraphs', () => {
    const desc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Line 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Line 2' }] },
      ],
    };
    expect(parseJiraDescription(desc)).toBe('Line 1\nLine 2');
  });

  it('parses orderedList and listItem', () => {
    const desc = {
      type: 'doc',
      content: [
        { type: 'orderedList', content: [
          { type: 'listItem', content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }
          ] },
          { type: 'listItem', content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }
          ] },
        ] },
      ],
    };
    expect(parseJiraDescription(desc)).toContain('1. Item 1');
    expect(parseJiraDescription(desc)).toContain('2. Item 2');
  });

  it('returns empty string for unknown types', () => {
    expect(parseJiraDescription({ type: 'doc', content: [{ type: 'unknown' }] })).toBe('');
    expect(parseJiraDescription({ type: 'other' })).toBe('');
  });
});

describe('parseJiraSubtasks', () => {
  it('returns empty string for non-array or empty', () => {
    expect(parseJiraSubtasks(undefined as unknown as unknown[])).toBe('');
    expect(parseJiraSubtasks(null as unknown as unknown[])).toBe('');
    expect(parseJiraSubtasks([])).toBe('');
  });

  it('parses subtasks array', () => {
    const subtasks = [
      { key: 'JIRA-1', fields: { summary: 'Sum 1', status: { name: 'To Do' } } },
      { key: 'JIRA-2', fields: { summary: 'Sum 2', status: { name: 'Done' } } },
    ];
    const result = parseJiraSubtasks(subtasks);
    expect(result).toContain('[JIRA-1] Sum 1 (To Do)');
    expect(result).toContain('[JIRA-2] Sum 2 (Done)');
  });

  it('handles missing fields/status/summary', () => {
    const subtasks = [
      { key: 'JIRA-3', fields: {} },
      { key: 'JIRA-4', fields: { summary: 'Sum 4' } },
      { key: 'JIRA-5', fields: { status: {} } },
    ];
    const result = parseJiraSubtasks(subtasks);
    expect(result).toContain('[JIRA-3]  ()');
    expect(result).toContain('[JIRA-4] Sum 4 ()');
    expect(result).toContain('[JIRA-5]  ()');
  });
});
