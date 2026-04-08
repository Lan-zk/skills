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
 * 将 ![img](./images/photo.jpg) 转为 ![img](file:///abs/path/to/images/photo.jpg)
 */
export function resolveImagePaths(markdown: string, baseDir: string): string {
  // 将 baseDir 转为 file:/// URL
  const normalizedBase = baseDir.replace(/\\/g, '/');
  const filePrefix = `file:///${normalizedBase.replace(/^\//, '')}`;
  return markdown.replace(
    /!\[([^\]]*)\]\(\.\//g,
    `![$1](${filePrefix}/`
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
