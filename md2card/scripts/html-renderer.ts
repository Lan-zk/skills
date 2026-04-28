import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import type { PageModel, Fragment, Inline, RenderOptions, ThemeConfig } from './types.js';
import { THEMES } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HtmlRenderer {
  private options: RenderOptions;
  private theme: ThemeConfig;
  private coverTemplate: Handlebars.TemplateDelegate;
  private pageTemplate: Handlebars.TemplateDelegate;

  constructor(options: RenderOptions) {
    this.options = options;
    this.theme = THEMES[options.theme] || THEMES.default;
    this.coverTemplate = this.loadTemplate(`cover-${this.theme.name}`);
    this.pageTemplate = this.loadTemplate(`page-${this.theme.name}`);
  }

  private loadTemplate(name: string): Handlebars.TemplateDelegate {
    // 尝试加载主题特定模板，如果没有则加载默认模板
    const themePath = path.resolve(__dirname, '../templates', `${name}.hbs`);
    const defaultPath = path.resolve(__dirname, '../templates', `${name.replace(`-${this.theme.name}`, '')}.hbs`);

    let templatePath = themePath;
    if (!fs.existsSync(themePath)) {
      templatePath = defaultPath;
    }

    // 如果都不存在，使用内联模板
    if (!fs.existsSync(templatePath)) {
      return this.getDefaultTemplate(name);
    }

    const templateHtml = fs.readFileSync(templatePath, 'utf-8');
    return Handlebars.compile(templateHtml);
  }

  private getDefaultTemplate(name: string): Handlebars.TemplateDelegate {
    const t = this.theme;
    if (name.startsWith('cover')) {
      return Handlebars.compile(this.getCoverTemplate());
    }
    return Handlebars.compile(this.getPageTemplate());
  }

  private getCoverTemplate(): string {
    const t = this.theme;
    // 标题占上半部分，预览占下半部分
    const titleSize = t.name === 'apple' ? '80' : t.name === 'claude' ? '72' : '64';
    const previewSize = t.name === 'apple' ? '24' : t.name === 'claude' ? '26' : '22';
    const previewLines = t.name === 'claude' ? 6 : 5;
    const previewMaxHeight = previewLines * parseInt(previewSize) * t.bodyLineHeight;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${t.name === 'claude' ? '1080' : this.options.pageWidth}px;
      height: ${t.name === 'claude' ? '1350' : this.options.pageHeight}px;
      font-family: '${t.bodyFontFamily}';
      background: ${t.backgroundColor};
      overflow: hidden;
    }
    .cover {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .cover-header {
      height: ${t.headerHeight}px;
      border-bottom: 1px solid ${t.hrColor};
      display: flex;
      align-items: center;
      padding: 0 64px;
      flex-shrink: 0;
    }
    .cover-title-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 60px 64px 40px;
    }
    .cover-title {
      font-family: '${t.titleFontFamily}';
      font-size: ${titleSize}px;
      font-weight: ${t.titleFontWeight};
      color: ${t.titleColor};
      line-height: 1.15;
      letter-spacing: ${t.name === 'apple' ? '-0.02em' : 'normal'};
      margin-bottom: 24px;
    }
    .cover-preview {
      font-family: '${t.bodyFontFamily}';
      font-size: ${previewSize}px;
      color: ${t.secondaryColor};
      line-height: ${t.bodyLineHeight};
      max-height: ${previewMaxHeight}px;
      overflow: hidden;
      border-top: 1px solid ${t.hrColor};
      padding-top: 24px;
    }
    .cover-preview-text {
      display: -webkit-box;
      -webkit-line-clamp: ${previewLines};
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .cover-footer {
      height: ${t.footerHeight}px;
      border-top: 1px solid ${t.hrColor};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 64px;
      flex-shrink: 0;
    }
    .cover-footer-text {
      font-family: '${t.bodyFontFamily}';
      font-size: 12px;
      color: ${t.secondaryColor};
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-header"></div>
    <div class="cover-title-section">
      <h1 class="cover-title">{{title}}</h1>
      <div class="cover-preview">
        <div class="cover-preview-text">{{preview}}</div>
      </div>
    </div>
    <div class="cover-footer">
      <span class="cover-footer-text">md2card</span>
    </div>
  </div>
</body>
</html>`;
  }

  private getPageTemplate(): string {
    const t = this.theme;
    // 增大字体大小
    const bodySize = t.name === 'apple' ? '24' : t.name === 'claude' ? '22' : '22';
    const heading1Size = t.name === 'apple' ? '44' : t.name === 'claude' ? '40' : '36';
    const heading2Size = t.name === 'apple' ? '34' : t.name === 'claude' ? '32' : '28';
    const heading3Size = t.name === 'apple' ? '28' : t.name === 'claude' ? '26' : '24';
    const codeSize = t.name === 'apple' ? '20' : t.name === 'claude' ? '18' : '18';
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${this.options.pageWidth}px;
      height: ${this.options.pageHeight}px;
      font-family: '${t.bodyFontFamily}';
      background: ${t.backgroundColor};
      overflow: hidden;
    }
    .page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .page-header {
      height: ${t.headerHeight}px;
      ${t.name === 'claude' ? `background: ${t.cardBackground}; border-bottom: 1px solid ${t.hrColor};` : `border-bottom: 1px solid ${t.hrColor};`}
      display: flex;
      align-items: center;
      padding: 0 64px;
      flex-shrink: 0;
    }
    .page-content {
      flex: 1;
      padding: 32px 64px;
      overflow: hidden;
    }
    .page-footer {
      height: ${t.footerHeight}px;
      ${t.name === 'claude' ? `background: ${t.cardBackground}; border-top: 1px solid ${t.hrColor};` : `border-top: 1px solid ${t.hrColor};`}
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 64px;
      flex-shrink: 0;
    }
    .footer-title {
      font-size: 14px;
      color: ${t.secondaryColor};
      max-width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .footer-page {
      font-size: 14px;
      color: ${t.secondaryColor};
    }
    .heading {
      font-family: '${t.titleFontFamily}';
      font-weight: ${t.titleFontWeight};
      color: ${t.titleColor};
      margin-top: 28px;
      margin-bottom: 14px;
    }
    .heading:first-child { margin-top: 0; }
    .heading-1 { font-size: ${heading1Size}px; line-height: 1.25; }
    .heading-2 { font-size: ${heading2Size}px; line-height: 1.3; }
    .heading-3 { font-size: ${heading3Size}px; line-height: 1.35; }
    .paragraph {
      font-size: ${bodySize}px;
      line-height: ${t.bodyLineHeight};
      color: ${t.bodyColor};
      margin-bottom: 14px;
    }
    .hr-block {
      border: none;
      border-top: 1px solid ${t.hrColor};
      margin: 24px 0;
    }
    .code-block {
      background: ${t.codeBackground};
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
      overflow-x: auto;
    }
    .code-content {
      font-family: ${t.codeFontFamily || "'SF Mono', Monaco, monospace"};
      font-size: ${codeSize}px;
      line-height: 1.6;
      color: ${t.codeColor};
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .inline-code {
      font-family: ${t.codeFontFamily || "'SF Mono', Monaco, monospace"};
      font-size: 0.85em;
      background: ${t.codeBackground};
      padding: 3px 8px;
      border-radius: 4px;
      color: ${t.codeColor};
    }
    .image-block {
      max-width: 100%;
      height: auto;
      margin: 12px 0;
      display: block;
    }
    .image-placeholder {
      background: ${t.cardBackground};
      color: ${t.secondaryColor};
      padding: 24px;
      text-align: center;
      border-radius: 8px;
      margin: 14px 0;
      font-size: 16px;
    }
    .list-block {
      margin: 14px 0;
      padding-left: 28px;
      color: ${t.bodyColor};
      font-size: ${bodySize}px;
      line-height: ${t.bodyLineHeight};
    }
    .list-item {
      margin-bottom: 8px;
    }
    .blockquote {
      border-left: 3px solid ${t.blockquoteBorder};
      margin: 14px 0;
      color: ${t.blockquoteColor};
      font-style: italic;
      background: ${t.blockquoteBackground};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
    }
    .blockquote p {
      margin: 0;
    }
    strong { font-weight: 600; }
    em { font-style: italic; }
  </style>
</head>
<body>
  <div class="page">
    <div class="page-header"></div>
    <div class="page-content">
      {{#each items}}
        {{{html}}}
      {{/each}}
    </div>
    <div class="page-footer">
      <span class="footer-title">{{footerTitle}}</span>
      <span class="footer-page">{{pageNumber}}</span>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 渲染封面页
   */
  renderCover(title: string, preview: string): string {
    return this.coverTemplate({
      title,
      preview,
      pageWidth: this.options.pageWidth,
      pageHeight: this.options.pageHeight,
      fontFamily: this.theme.titleFontFamily,
    });
  }

  /**
   * 渲染内容页
   */
  renderPage(pageModel: PageModel, footerTitle: string = ''): string {
    const items = pageModel.items.map(item => ({
      ...item.fragment,
      html: this.fragmentToHtml(item.fragment),
    }));

    return this.pageTemplate({
      items,
      pageWidth: this.options.pageWidth,
      pageHeight: this.options.pageHeight,
      paddingTop: this.options.paddingTop,
      paddingRight: this.options.paddingRight,
      paddingBottom: this.options.paddingBottom,
      paddingLeft: this.options.paddingLeft,
      codeFontFamily: this.options.codeFontFamily,
      codeFontSize: this.options.codeFontSize,
      footerTitle,
      pageNumber: `${pageModel.index}`,
    });
  }

  /**
   * 将 Fragment 转换为 HTML
   */
  private fragmentToHtml(fragment: Fragment): string {
    switch (fragment.type) {
      case 'heading':
        return this.renderHeading(fragment);
      case 'paragraph':
        return this.renderParagraph(fragment);
      case 'hr':
        return '<hr class="hr-block">';
      case 'code':
        return this.renderCode(fragment);
      case 'image':
        return this.renderImage(fragment);
      case 'list':
        return this.renderList(fragment);
      case 'blockquote':
        return this.renderBlockquote(fragment);
      default:
        return '';
    }
  }

  private renderHeading(fragment: { level: number; inlines: Inline[] }): string {
    const tag = `h${fragment.level}`;
    return `<${tag} class="heading heading-${fragment.level}">${this.inlinesToHtml(fragment.inlines)}</${tag}>`;
  }

  private renderParagraph(fragment: { inlines: Inline[] }): string {
    return `<p class="paragraph">${this.inlinesToHtml(fragment.inlines)}</p>`;
  }

  private renderCode(fragment: { language?: string; value: string }): string {
    const escaped = this.escapeHtml(fragment.value);
    return `<pre class="code-block"><code class="code-content">${escaped}</code></pre>`;
  }

  private renderImage(fragment: { src: string; alt?: string; title?: string; error?: boolean }): string {
    if (fragment.error) {
      return `<div class="image-placeholder">Image not found: ${this.escapeHtml(fragment.src)}</div>`;
    }
    return `<img class="image-block" src="${this.escapeHtml(fragment.src)}" alt="${this.escapeHtml(fragment.alt || '')}">`;
  }

  private renderList(fragment: { ordered: boolean; start?: number; items: Array<{ blocks: Array<{ type: string; inlines?: Inline[]; value?: string }> }> }): string {
    const tag = fragment.ordered ? 'ol' : 'ul';
    const startAttr = fragment.ordered && fragment.start ? ` start="${fragment.start}"` : '';

    const itemsHtml = fragment.items.map(item => {
      const content = item.blocks
        .filter(b => b.type === 'paragraph' && b.inlines)
        .map(b => this.inlinesToHtml(b.inlines!))
        .join('');
      return `<li class="list-item">${content}</li>`;
    }).join('');

    return `<${tag} class="list-block"${startAttr}>${itemsHtml}</${tag}>`;
  }

  private renderBlockquote(fragment: { blocks: Array<{ type: string; inlines?: Inline[] }> }): string {
    const content = fragment.blocks
      .filter(b => b.type === 'paragraph' && b.inlines)
      .map(b => `<p>${this.inlinesToHtml(b.inlines!)}</p>`)
      .join('');

    return `<blockquote class="blockquote">${content}</blockquote>`;
  }

  private inlinesToHtml(inlines: Inline[]): string {
    return inlines.map(inline => {
      switch (inline.type) {
        case 'text':
          return this.escapeHtml(inline.value);
        case 'strong':
          return `<strong>${this.inlinesToHtml(inline.children)}</strong>`;
        case 'emphasis':
          return `<em>${this.inlinesToHtml(inline.children)}</em>`;
        case 'inlineCode':
          return `<code class="inline-code">${this.escapeHtml(inline.value)}</code>`;
      }
    }).join('');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getTheme(): ThemeConfig {
    return this.theme;
  }
}
