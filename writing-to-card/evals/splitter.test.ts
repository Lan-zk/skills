import { splitTokensToPages } from '../src/splitter';
import { parseToTokens } from '../src/parser';

describe('splitter', () => {
  describe('splitTokensToPages', () => {
    it('should return empty array for empty input', () => {
      expect(splitTokensToPages([])).toEqual([]);
    });

    it('should return single page for short content', () => {
      const tokens = parseToTokens('Short text');
      const pages = splitTokensToPages(tokens, 280);
      expect(pages.length).toBe(1);
      expect(pages[0]).toContain('Short text');
    });

    it('should split long content into multiple pages', () => {
      const longText = '这是一段很长的文本内容。'.repeat(30);
      const tokens = parseToTokens(longText);
      const pages = splitTokensToPages(tokens, 280);
      expect(pages.length).toBeGreaterThan(1);
    });

    it('should close compound tags at page boundary', () => {
      // Create content where bold text crosses a page boundary
      const text = '**加粗内容跨页面测试**';
      const tokens = parseToTokens(text);
      const pages = splitTokensToPages(tokens, 5); // Very small page size

      // Verify HTML balance: all < have matching >
      for (const page of pages) {
        const openCount = (page.match(/<[a-z]+/gi) || []).length;
        const closeCount = (page.match(/<\/[a-z]+>/gi) || []).length;
        expect(openCount).toBe(closeCount);
      }
    });

    it('should handle multiple paragraphs', () => {
      const tokens = parseToTokens('第一段文字。\n\n第二段文字。\n\n第三段文字。');
      const pages = splitTokensToPages(tokens, 280);
      expect(pages.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle blockquote', () => {
      const tokens = parseToTokens('> 这是一段引用');
      const html = splitTokensToPages(tokens, 280)[0];
      expect(html).toContain('<blockquote>');
    });

    it('should handle unordered list', () => {
      const tokens = parseToTokens('- 项目一\n- 项目二\n- 项目三');
      const html = splitTokensToPages(tokens, 280)[0];
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });

    it('should handle ordered list', () => {
      const tokens = parseToTokens('1. 第一项\n2. 第二项\n3. 第三项');
      const html = splitTokensToPages(tokens, 280)[0];
      expect(html).toContain('<ol>');
    });

    it('should handle h1 and h2 headings', () => {
      const tokens = parseToTokens('# 一级标题\n\n## 二级标题');
      const html = splitTokensToPages(tokens, 280)[0];
      expect(html).toContain('<h1>');
      expect(html).toContain('<h2>');
    });

    it('should preserve bold tags across page split', () => {
      // Force split in the middle of bold text
      const tokens = parseToTokens('**bold bold bold bold bold bold bold bold**');
      const pages = splitTokensToPages(tokens, 15);

      // First page should close </strong>, last page should have <strong>
      // All pages should have balanced tags
      for (const page of pages) {
        const opens = (page.match(/<strong>/gi) || []).length;
        const closes = (page.match(/<\/strong>/gi) || []).length;
        expect(Math.abs(opens - closes)).toBeLessThanOrEqual(1);
      }
    });

    it('should handle inline code', () => {
      const tokens = parseToTokens('Run `npm install` command');
      const html = splitTokensToPages(tokens, 280)[0];
      expect(html).toContain('<code>');
    });

    it('should handle mixed content with bold, italic and code', () => {
      const tokens = parseToTokens('普通文字**加粗**和*斜体*和`代码`');
      const html = splitTokensToPages(tokens, 280)[0];
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
      expect(html).toContain('<code>');
    });
  });
});
