import type { Page } from 'playwright';
import type { Block, Inline, Fragment, RenderOptions } from './types.js';

export class Measurer {
  private page: Page;
  private containerSelector = '#measure-container';
  private contentWidth: number;
  private contentHeight: number;
  private fontSize: number;
  private lineHeight: number;

  constructor(page: Page, options: RenderOptions) {
    this.page = page;
    this.contentWidth = options.pageWidth - options.paddingLeft - options.paddingRight;
    this.contentHeight = options.pageHeight - options.paddingTop - options.paddingBottom;
    this.fontSize = options.baseFontSize;
    this.lineHeight = options.lineHeight;
  }

  /**
   * 初始化测量容器
   */
  async init(): Promise<void> {
    const containerStyle = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${this.contentWidth}px;
      font-family: ${this.getFontFamily()};
      font-size: ${this.fontSize}px;
      line-height: ${this.lineHeight};
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

    // Create container in browser context
    await this.page.evaluate((style: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as any;
      const d = g.document;
      if (!d) return;
      let container = d.querySelector('#measure-container');
      if (!container) {
        container = d.createElement('div');
        container.id = 'measure-container';
        d.body.appendChild(container);
      }
      container.style.cssText = style;
    }, containerStyle);
  }

  /**
   * 清理测量容器
   */
  async cleanup(): Promise<void> {
    await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as any;
      const d = g.document;
      if (!d) return;
      const container = d.querySelector('#measure-container');
      if (container) container.innerHTML = '';
    });
  }

  /**
   * 测量单个 block 的高度
   */
  async measureBlock(block: Block): Promise<number> {
    const html = this.blockToHtml(block);
    return this.measureHtmlHeight(html);
  }

  /**
   * 测量 HTML 片段的高度
   */
  async measureHtmlHeight(html: string): Promise<number> {
    return this.page.evaluate((htmlContent: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as any;
      const d = g.document;
      if (!d) return 0;
      const container = d.querySelector('#measure-container');
      if (!container) return 0;
      container.innerHTML = htmlContent;
      return container.scrollHeight;
    }, html);
  }

  /**
   * 二分查找：找到当前页可容纳的最大 fragment
   */
  async findMaxFragment(
    inlines: Inline[],
    maxHeight: number
  ): Promise<{ fit: Fragment; rest: Inline[] }> {
    const tokens = this.flattenInlines(inlines);
    let low = 0;
    let high = tokens.length;

    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      const prefix = tokens.slice(0, mid);
      const html = this.tokensToHtml(prefix);
      const height = await this.measureHtmlHeight(html);

      if (height <= maxHeight) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    if (low === 0) {
      return { fit: { type: 'paragraph', inlines: [] }, rest: inlines };
    }

    const fitTokens = tokens.slice(0, low);
    const restTokens = tokens.slice(low);
    const closedHtml = this.ensureTagClosure(fitTokens, restTokens);

    return {
      fit: { type: 'paragraph', inlines: this.htmlToInlines(closedHtml) },
      rest: this.tokensToInlines(restTokens),
    };
  }

  /**
   * 代码块按行拆分
   */
  async splitCodeByLines(
    code: { language?: string; value: string },
    maxHeight: number
  ): Promise<{ fit: Fragment; rest: Inline[] }> {
    const lines = code.value.split('\n');
    let low = 0;
    let high = lines.length;

    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      const prefixLines = lines.slice(0, mid);
      const html = this.codeToHtml({ language: code.language, value: prefixLines.join('\n') });
      const height = await this.measureHtmlHeight(html);

      if (height <= maxHeight) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    const fitLines = lines.slice(0, low);
    const restLines = lines.slice(low);

    return {
      fit: { type: 'code', language: code.language, value: fitLines.join('\n') },
      rest: [{ type: 'text', value: restLines.join('\n') }],
    };
  }

  getContentHeight(): number {
    return this.contentHeight;
  }

  getContentWidth(): number {
    return this.contentWidth;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private flattenInlines(inlines: Inline[]): Inline[] {
    const result: Inline[] = [];
    for (const inline of inlines) {
      switch (inline.type) {
        case 'text':
          result.push(inline);
          break;
        case 'strong':
          result.push({ type: 'strong', children: this.flattenInlines(inline.children) });
          break;
        case 'emphasis':
          result.push({ type: 'emphasis', children: this.flattenInlines(inline.children) });
          break;
        case 'inlineCode':
          result.push(inline);
          break;
      }
    }
    return result;
  }

  private tokensToHtml(tokens: Inline[]): string {
    return tokens.map(token => this.inlineToHtml(token)).join('');
  }

  private inlineToHtml(inline: Inline): string {
    switch (inline.type) {
      case 'text':
        return this.escapeHtml(inline.value);
      case 'strong':
        return `<strong>${this.tokensToHtml(inline.children)}</strong>`;
      case 'emphasis':
        return `<em>${this.tokensToHtml(inline.children)}</em>`;
      case 'inlineCode':
        return `<code>${this.escapeHtml(inline.value)}</code>`;
    }
  }

  private ensureTagClosure(fitTokens: Inline[], restTokens: Inline[]): string {
    const html = this.tokensToHtml(fitTokens);
    const openTags = this.getOpenTags(fitTokens);
    const closeTags = this.getCloseTags(restTokens);
    return html + closeTags.join('') + openTags.reverse().map(tag => `</${tag}>`).join('');
  }

  private getOpenTags(tokens: Inline[]): string[] {
    const tags: string[] = [];
    for (const token of tokens) {
      if (token.type === 'strong') tags.push('strong');
      if (token.type === 'emphasis') tags.push('em');
    }
    return tags;
  }

  private getCloseTags(tokens: Inline[]): string[] {
    const tags: string[] = [];
    for (const token of tokens) {
      if (token.type === 'strong') tags.push('strong');
      if (token.type === 'emphasis') tags.push('em');
    }
    return tags;
  }

  private tokensToInlines(tokens: Inline[]): Inline[] {
    return tokens;
  }

  private htmlToInlines(html: string): Inline[] {
    const text = html.replace(/<[^>]*>/g, '');
    return [{ type: 'text', value: text }];
  }

  private blockToHtml(block: Block): string {
    switch (block.type) {
      case 'heading':
        const tag = `h${block.level}`;
        return `<${tag}>${this.tokensToHtml(block.inlines)}</${tag}>`;
      case 'paragraph':
        return `<p>${this.tokensToHtml(block.inlines)}</p>`;
      case 'hr':
        return '<hr>';
      case 'code':
        return this.codeToHtml(block);
      case 'image':
        return `<img src="${this.escapeHtml(block.src)}" alt="${this.escapeHtml(block.alt || '')}">`;
      default:
        return '';
    }
  }

  private codeToHtml(code: { language?: string; value: string }): string {
    return `<pre><code>${this.escapeHtml(code.value)}</code></pre>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private getFontFamily(): string {
    return 'sans-serif';
  }
}