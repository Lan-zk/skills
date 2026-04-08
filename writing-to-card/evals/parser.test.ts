import { parseToTokens, renderToHtml, resolveImagePaths } from '../src/parser';

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
    it('should resolve relative image paths to file URLs', () => {
      const result = resolveImagePaths('![img](./images/photo.jpg)', '/home/user/article');
      expect(result).toContain('file:///home/user/article/images/photo.jpg');
    });

    it('should not modify paths that do not start with ./', () => {
      const result = resolveImagePaths('![img](/absolute/path.jpg)', '/home/user');
      expect(result).toContain('/absolute/path.jpg');
    });

    it('should handle nested relative paths', () => {
      const result = resolveImagePaths('![img](./subdir/image.png)', '/mnt/data');
      expect(result).toContain('file:///mnt/data/subdir/image.png');
    });
  });
});
