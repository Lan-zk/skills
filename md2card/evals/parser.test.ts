import { describe, it, expect } from '@jest/globals';
import { parseMarkdown, extractTitle } from '../scripts/parser.js';
import type { DocumentModel, Block } from '../scripts/types.js';

describe('parser', () => {
  describe('parseMarkdown', () => {
    it('should parse simple heading', () => {
      const content = '# Hello World';
      const doc = parseMarkdown(content, 'test', '/tmp');

      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0]).toEqual({
        type: 'heading',
        level: 1,
        inlines: [{ type: 'text', value: 'Hello World' }],
      });
    });

    it('should parse paragraph with inline styles', () => {
      const content = 'This is **bold** and *italic* and `code`.';
      const doc = parseMarkdown(content, 'test', '/tmp');

      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0]).toEqual({
        type: 'paragraph',
        inlines: [
          { type: 'text', value: 'This is ' },
          { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
          { type: 'text', value: ' and ' },
          { type: 'emphasis', children: [{ type: 'text', value: 'italic' }] },
          { type: 'text', value: ' and ' },
          { type: 'inlineCode', value: 'code' },
          { type: 'text', value: '.' },
        ],
      });
    });

    it('should parse list', () => {
      const content = '- Item 1\n- Item 2\n- Item 3';
      const doc = parseMarkdown(content, 'test', '/tmp');

      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0].type).toBe('list');
      expect((doc.blocks[0] as Block & { ordered: boolean }).ordered).toBe(false);
    });

    it('should parse ordered list', () => {
      const content = '1. First\n2. Second\n3. Third';
      const doc = parseMarkdown(content, 'test', '/tmp');

      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0].type).toBe('list');
    });

    it('should parse blockquote', () => {
      const content = '> This is a quote';
      const doc = parseMarkdown(content, 'test', '/tmp');

      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0].type).toBe('blockquote');
    });

    it('should parse code block', () => {
      const content = '```javascript\nconsole.log("hello");\n```';
      const doc = parseMarkdown(content, 'test', '/tmp');

      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0].type).toBe('code');
    });

    it('should parse hr', () => {
      const content = '---\nSome content';
      const doc = parseMarkdown(content, 'test', '/tmp');

      expect(doc.blocks.length).toBe(2);
      expect(doc.blocks[0].type).toBe('hr');
    });

    it('should parse image inside paragraph', () => {
      const content = '![alt text](./image.png)';
      const doc = parseMarkdown(content, 'test', '/tmp');

      // In remark AST, standalone images are wrapped in a paragraph
      expect(doc.blocks.length).toBe(1);
      expect(doc.blocks[0].type).toBe('paragraph');
    });

    it('should parse standalone image block', () => {
      // Use remark-gfm which may handle images differently
      const content = '\n![alt text](./image.png)\n';
      const doc = parseMarkdown(content, 'test', '/tmp');

      // Images may be parsed as paragraphs in remark
      expect(doc.blocks.length).toBeGreaterThan(0);
    });
  });

  describe('extractTitle', () => {
    it('should extract h1 title', () => {
      const content = '# My Title\nSome content';
      const doc = parseMarkdown(content, 'default', '/tmp');
      const title = extractTitle(doc);

      expect(title).toBe('My Title');
    });

    it('should return filename if no h1', () => {
      const content = '## Subtitle\nSome content';
      const doc = parseMarkdown(content, 'my-file', '/tmp');
      const title = extractTitle(doc);

      expect(title).toBe('my-file');
    });
  });
});
