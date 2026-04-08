import MarkdownIt from 'markdown-it';
import * as fs from 'fs';
import * as path from 'path';
import { Token, tokenAttr } from './types';

/** 单例 markdown-it 实例 */
let mdInstance: MarkdownIt | null = null;

function createMarkdownIt(): MarkdownIt {
  return new MarkdownIt({
    html: true,
    linkify: false,
    typographer: true,
    breaks: false,
  });
}

function getMd(): MarkdownIt {
  if (!mdInstance) {
    mdInstance = createMarkdownIt();
  }
  return mdInstance;
}

/**
 * 将原生 markdown-it Token 转换为标准 Token 接口
 */
function normalizeToken(token: import('markdown-it').Token): Token {
  return {
    type: token.type,
    tag: token.tag,
    content: token.content ?? '',
    children: token.children ? token.children.map(normalizeToken) : null,
    map: token.map ?? null,
    info: token.info ?? '',
    markup: token.markup ?? '',
    meta: (token.meta ?? {}) as Record<string, unknown>,
    attr: (token.attrs as [string, string][] | null) ?? undefined,
  };
}

/**
 * 将 Markdown 解析为 Token 树（用于分页切割）
 */
export function parseToTokens(markdown: string): Token[] {
  const md = getMd();
  const env: Record<string, unknown> = {};
  const tokens = md.parse(markdown, env);
  return tokens.map(normalizeToken);
}

/**
 * 将 Markdown 直接渲染为 HTML 字符串
 */
export function renderToHtml(markdown: string): string {
  const md = getMd();
  return md.render(markdown);
}

/**
 * 修正 Markdown 中的图片相对路径为绝对路径
 * 支持 ./、../ 和无前缀的相对路径，转换为 file:// URL
 * 绝对 URL（http://, https://, file://）保持不变
 */
export function resolveImagePaths(markdown: string, baseDir: string): string {
  const normalizedBase = baseDir.replace(/\\/g, '/');
  return markdown.replace(
    // 匹配 ![alt](url "title") 或 ![alt](url) 或 ![alt](url#anchor)
    /!\[([^\]]*)\]\(([^)"]+(?:"[^"]*")?)\)/g,
    (match: string, alt: string, src: string): string => {
      // 跳过已经是绝对 URL 的路径
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('file://')) {
        return match;
      }
      // 分离路径与 title/fragment 部分
      const titleMatch = src.match(/^(.+?)\s+"([^"]*)"$/);
      const fragmentMatch = src.match(/^(.+?)(#.*)$/);
      let rawPath = src;
      let extra = '';
      if (titleMatch) {
        rawPath = titleMatch[1];
        extra = ` "${titleMatch[2]}"`;
      } else if (fragmentMatch) {
        rawPath = fragmentMatch[1];
        extra = fragmentMatch[2];
      }
      // 将相对路径相对于 baseDir 解析为绝对路径
      const resolvedPath = path.posix.resolve(normalizedBase, rawPath.replace(/\\/g, '/'));
      return `![${alt}](file://${resolvedPath}${extra})`;
    }
  );
}

/**
 * 将 Markdown 文件内容读取并渲染为 HTML
 * 图片路径以文件所在目录为基准解析
 */
export function renderFileToHtml(filePath: string, baseDir?: string): string {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir ?? '.', filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const resolved = resolveImagePaths(content, path.dirname(absolutePath));
  return renderToHtml(resolved);
}
