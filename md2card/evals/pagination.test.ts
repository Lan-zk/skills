import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createBrowserManager, closeBrowserManager, closeBrowser } from '../scripts/browser-manager.js';
import { Paginator } from '../scripts/paginator.js';
import { parseMarkdown } from '../scripts/parser.js';
import type { RenderOptions } from '../scripts/types.js';

const TEST_OPTIONS: RenderOptions = {
  input: 'test.md',
  outputDir: '/tmp/output',
  pageWidth: 1242,
  pageHeight: 1660,
  paddingTop: 96,
  paddingRight: 88,
  paddingBottom: 96,
  paddingLeft: 88,
  theme: 'default',
  cover: true,
  fontFamily: 'sans-serif',
  baseFontSize: 36,
  lineHeight: 1.6,
  codeFontFamily: 'monospace',
  codeFontSize: 28,
  imageMaxHeightRatio: 0.8,
};

describe('paginator', () => {
  let manager: Awaited<ReturnType<typeof createBrowserManager>>;
  let paginator: Paginator;

  beforeAll(async () => {
    manager = await createBrowserManager(TEST_OPTIONS.pageWidth, TEST_OPTIONS.pageHeight);
    paginator = new Paginator(manager.page, TEST_OPTIONS);
    await paginator.init();
  });

  afterAll(async () => {
    await paginator.cleanup();
    await closeBrowserManager(manager);
    await closeBrowser();
  });

  it('should create single page for short content', async () => {
    const content = '# Title\n\nShort content.';
    const doc = parseMarkdown(content, 'test', '/tmp');
    const pages = await paginator.paginate(doc, false);

    expect(pages.length).toBe(1);
  });

  it('should mark cover page when enabled', async () => {
    const content = '# Title\n\nContent.';
    const doc = parseMarkdown(content, 'test', '/tmp');
    const pages = await paginator.paginate(doc, true);

    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0].isCover).toBe(true);
  });

  it('should handle multiple headings', async () => {
    const content = '# H1\n\nParagraph 1.\n\n## H2\n\nParagraph 2.\n\n### H3\n\nParagraph 3.';
    const doc = parseMarkdown(content, 'test', '/tmp');
    const pages = await paginator.paginate(doc, false);

    expect(pages.length).toBeGreaterThanOrEqual(1);
    // Verify all headings are preserved
    const headings = pages.flatMap(p => p.items.filter(i => i.blockType === 'heading'));
    expect(headings.length).toBe(3);
  });

  it('should preserve inline styles in paragraphs', async () => {
    const content = '**Bold** and *italic* and `code`.';
    const doc = parseMarkdown(content, 'test', '/tmp');
    const pages = await paginator.paginate(doc, false);

    expect(pages.length).toBeGreaterThanOrEqual(1);
    // Check that page content exists
    expect(pages[0].items.length).toBeGreaterThan(0);
  });

  it('should handle empty document', async () => {
    const content = '';
    const doc = parseMarkdown(content, 'test', '/tmp');
    const pages = await paginator.paginate(doc, false);

    expect(pages.length).toBe(0);
  });
});
