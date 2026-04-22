import { describe, it, expect } from '@jest/globals';
import { HtmlRenderer } from '../scripts/html-renderer.js';
import type { RenderOptions, PageModel } from '../scripts/types.js';

const TEST_OPTIONS: RenderOptions = {
  input: 'test.md',
  outputDir: '/tmp/output',
  pageWidth: 1242,
  pageHeight: 1660,
  paddingTop: 96,
  paddingRight: 88,
  paddingBottom: 96,
  paddingLeft: 88,
  theme: 'apple',
  cover: true,
  fontFamily: 'sans-serif',
  baseFontSize: 36,
  lineHeight: 1.6,
  codeFontFamily: 'monospace',
  codeFontSize: 28,
  imageMaxHeightRatio: 0.8,
};

describe('html-renderer', () => {
  let renderer: HtmlRenderer;

  beforeEach(() => {
    renderer = new HtmlRenderer(TEST_OPTIONS);
  });

  describe('renderCover', () => {
    it('should render cover with title', () => {
      const html = renderer.renderCover('Test Title', 'Preview text here');

      expect(html).toContain('cover-title');
      expect(html).toContain('Test Title');
      expect(html).toContain(`width: ${TEST_OPTIONS.pageWidth}px`);
      expect(html).toContain(`height: ${TEST_OPTIONS.pageHeight}px`);
      expect(html).toContain('Preview text here');
    });
  });

  describe('renderPage', () => {
    it('should render empty page', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [],
      };

      const html = renderer.renderPage(pageModel, 'Test');

      expect(html).toContain('class="page"');
      expect(html).toContain('class="page-content"');
    });

    it('should render heading fragment', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'heading',
            fragment: {
              type: 'heading',
              level: 1,
              inlines: [{ type: 'text', value: 'My Heading' }],
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');

      expect(html).toContain('heading-1');
      expect(html).toContain('My Heading');
    });

    it('should render paragraph fragment', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'paragraph',
            fragment: {
              type: 'paragraph',
              inlines: [
                { type: 'text', value: 'Hello ' },
                { type: 'strong', children: [{ type: 'text', value: 'World' }] },
              ],
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');

      expect(html).toContain('class="paragraph"');
      expect(html).toContain('Hello ');
      expect(html).toContain('World');
    });

    it('should render code fragment', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'code',
            fragment: {
              type: 'code',
              language: 'javascript',
              value: 'console.log("hello");',
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');

      expect(html).toContain('class="code-block"');
      expect(html).toContain('console.log');
    });

    it('should render hr fragment', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'hr',
            fragment: { type: 'hr' },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');

      expect(html).toContain('class="hr-block"');
    });

    it('should render image fragment', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'image',
            fragment: {
              type: 'image',
              src: './test.png',
              alt: 'Test image',
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');

      expect(html).toContain('class="image-block"');
      expect(html).toContain('src="./test.png"');
      expect(html).toContain('alt="Test image"');
    });

    it('should render image error placeholder', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'image',
            fragment: {
              type: 'image',
              src: './missing.png',
              alt: 'Missing',
              error: true,
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');

      expect(html).toContain('class="image-placeholder"');
    });
  });

  describe('inline styles', () => {
    it('should render strong inline', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'paragraph',
            fragment: {
              type: 'paragraph',
              inlines: [
                { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
              ],
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');
      expect(html).toContain('<strong>bold</strong>');
    });

    it('should render emphasis inline', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'paragraph',
            fragment: {
              type: 'paragraph',
              inlines: [
                { type: 'emphasis', children: [{ type: 'text', value: 'italic' }] },
              ],
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');
      expect(html).toContain('<em>italic</em>');
    });

    it('should render inline code', () => {
      const pageModel: PageModel = {
        index: 1,
        isCover: false,
        items: [
          {
            blockType: 'paragraph',
            fragment: {
              type: 'paragraph',
              inlines: [
                { type: 'inlineCode', value: 'code' },
              ],
            },
          },
        ],
      };

      const html = renderer.renderPage(pageModel, 'Test');
      expect(html).toContain('class="inline-code"');
      expect(html).toContain('code');
    });
  });
});
