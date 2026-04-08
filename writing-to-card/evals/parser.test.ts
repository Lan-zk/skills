import * as fs from 'fs';
import * as path from 'path';
import { parseToTokens, renderToHtml, resolveImagePaths, renderFileToHtml } from '../src/parser';

describe('parser', () => {
  describe('parseToTokens', () => {
    it('should parse paragraph tokens', () => {
      const tokens = parseToTokens('Hello world');
      const paraToken = tokens.find(t => t.type === 'paragraph_open');
      expect(paraToken).toBeDefined();
    });

    it('should parse inline content with bold', () => {
      const tokens = parseToTokens('This is **bold** text');
      const inlineToken = tokens.find(t => t.type === 'inline');
      expect(inlineToken?.content).toContain('**bold**');
    });

    it('should parse image token', () => {
      const tokens = parseToTokens('![desc](./photo.jpg)');
      // Image tokens are nested inside inline tokens in markdown-it output
      const inlineToken = tokens.find(t => t.type === 'inline');
      expect(inlineToken).toBeDefined();
      const imageToken = inlineToken?.children?.find(t => t.type === 'image');
      expect(imageToken).toBeDefined();
    });
  });

  describe('renderToHtml', () => {
    it('should render bold as <strong>', () => {
      const html = renderToHtml('This is **bold**');
      expect(html).toContain('<strong>bold</strong>');
    });

    it('should render italic as <em>', () => {
      const html = renderToHtml('This is *italic*');
      expect(html).toContain('<em>italic</em>');
    });

    it('should render inline code as <code>', () => {
      const html = renderToHtml('Run `npm install`');
      expect(html).toContain('<code>');
    });

    it('should render h1 and h2', () => {
      const html = renderToHtml('# Title\n\n## Subtitle');
      expect(html).toContain('<h1>');
      expect(html).toContain('<h2>');
    });

    it('should render blockquote', () => {
      const html = renderToHtml('> This is a quote');
      expect(html).toContain('<blockquote>');
    });

    it('should render unordered list', () => {
      const html = renderToHtml('- item 1\n- item 2');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });

    it('should render ordered list', () => {
      const html = renderToHtml('1. first\n2. second');
      expect(html).toContain('<ol>');
    });

    it('should render image with src', () => {
      const html = renderToHtml('![desc](./img.jpg)');
      expect(html).toContain('src="./img.jpg"');
    });
  });

  describe('resolveImagePaths', () => {
    it('should resolve ./ relative image paths to file URLs', () => {
      const result = resolveImagePaths('![img](./images/photo.jpg)', '/home/user/article');
      expect(result).toContain('file:///home/user/article/images/photo.jpg');
    });

    it('should resolve ../ relative image paths', () => {
      const result = resolveImagePaths('![img](../images/photo.jpg)', '/home/user/article/sub');
      expect(result).toContain('file:///home/user/article/images/photo.jpg');
    });

    it('should resolve bare relative image paths (no ./ prefix)', () => {
      const result = resolveImagePaths('![img](images/photo.jpg)', '/home/user/article');
      expect(result).toContain('file:///home/user/article/images/photo.jpg');
    });

    it('should skip absolute http:// and https:// URLs', () => {
      const result = resolveImagePaths(
        '![img](https://example.com/photo.jpg)',
        '/home/user'
      );
      expect(result).toContain('https://example.com/photo.jpg');
    });

    it('should skip file:// URLs', () => {
      const result = resolveImagePaths(
        '![img](file:///home/user/photo.jpg)',
        '/home/user'
      );
      expect(result).toContain('file:///home/user/photo.jpg');
    });

    it('should preserve fragment/anchor in image path', () => {
      const result = resolveImagePaths('![img](./photo.jpg#section)', '/home/user');
      expect(result).toContain('file:///home/user/photo.jpg#section');
    });

    it('should preserve title in image path', () => {
      const result = resolveImagePaths('![img](./photo.jpg "My Title")', '/home/user');
      expect(result).toContain('file:///home/user/photo.jpg');
      expect(result).toContain('"My Title"');
    });

    it('should handle nested subdirectory paths', () => {
      const result = resolveImagePaths('![img](./subdir/nested/image.png)', '/mnt/data');
      expect(result).toContain('file:///mnt/data/subdir/nested/image.png');
    });
  });

  describe('renderFileToHtml', () => {
    const tmpDir = path.join(__dirname, '..', 'tmp');

    beforeAll(() => {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    });

    afterAll(() => {
      // Clean up temp file if it exists
      const tmpFile = path.join(tmpDir, 'test-input.md');
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    });

    it('should read a markdown file and render it to HTML', () => {
      const tmpFile = path.join(tmpDir, 'test-input.md');
      fs.writeFileSync(tmpFile, '# Hello\n\nThis is **bold** text.\n\n![img](./photo.jpg)', 'utf-8');

      const html = renderFileToHtml(tmpFile);

      expect(html).toContain('<h1>');
      expect(html).toContain('<strong>bold</strong>');
      // Image path should be resolved relative to the file's directory
      expect(html).toContain('file:///');
    });

    it('should throw if file does not exist', () => {
      expect(() => {
        renderFileToHtml('/nonexistent/path/file.md');
      }).toThrow();
    });
  });
});
