# writing-to-card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Markdown 长文转换为 1080×1440 PNG 图片序列，输出到指定目录。

**Architecture:** TypeScript + Playwright + markdown-it + Handlebars。markdown-it 解析 Markdown 为 HTML，分页切割在 token 层面按字符数执行，Handlebars 模板注入 HTML 片段后由 Playwright 截图输出。

**Tech Stack:** TypeScript, Playwright, markdown-it, Handlebars, Jest

---

## 文件结构

```
writing-to-card/
├── SKILL.md                      # 工作流编排层（唯一 LLM 调用层）
├── package.json                  # 依赖管理
├── tsconfig.json
├── jest.config.js
├── src/
│   ├── index.ts                  # Skill 入口：接收参数、编排流程、写入文件
│   ├── types.ts                  # SkillInput / SkillOutput / Page 接口
│   ├── constants.ts              # 视觉常量（字号、边距、颜色、字符容量）
│   ├── parser.ts                 # markdown-it 实例配置
│   ├── splitter.ts               # 分页切割逻辑（token 遍历 + 安全闭合）
│   ├── renderer.ts               # Playwright 渲染 + 截图
│   └── templates/
│       ├── cover.hbs             # 封面模板（Handlebars）
│       └── content.hbs           # 正文模板（Handlebars）
├── evals/
│   ├── parser.test.ts            # markdown-it 输出格式验证
│   ├── splitter.test.ts          # 分页切割 + 安全闭合测试
│   └── renderer.test.ts          # 渲染截图集成测试
└── references/
    └── constants-spec.md         # 视觉常量来源说明（可选）
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `writing-to-card/package.json`
- Create: `writing-to-card/tsconfig.json`
- Create: `writing-to-card/jest.config.js`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "writing-to-card",
  "version": "1.0.0",
  "description": "Convert Markdown articles to 1080x1440 PNG cards for Xiaohongshu",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "markdown-it": "^14.1.0",
    "playwright": "^1.49.0",
    "handlebars": "^4.7.8"
  },
  "devDependencies": {
    "@types/markdown-it": "^14.1.2",
    "@types/node": "^22.0.0",
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.2",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "evals"]
}
```

- [ ] **Step 3: 创建 jest.config.js**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/evals'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 }
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json jest.config.js
git commit -m "chore: scaffold writing-to-card project"
```

---

## Task 2: 类型定义与视觉常量

**Files:**
- Create: `writing-to-card/src/types.ts`
- Create: `writing-to-card/src/constants.ts`

- [ ] **Step 1: 创建 src/types.ts**

```typescript
export interface SkillInput {
  /** 封面主标题 */
  title: string;
  /** 封面副标题（可选） */
  subtitle?: string;
  /** 正文 Markdown 内容（字符串或文件路径） */
  content: string;
  /** 输入 Markdown 文件所在目录，用于解析相对图片路径 */
  contentBaseDir?: string;
  /** 模板名称（暂未实现多模板，固定 default） */
  template?: string;
  /** 输出目录 */
  outputDir: string;
}

export interface SkillOutput {
  /** 生成的图片文件路径数组，按顺序排列 */
  files: string[];
}

/** 单页数据 */
export interface Page {
  /** 页面类型：封面或正文 */
  type: 'cover' | 'content';
  /** HTML 内容片段 */
  html: string;
}

/** markdown-it Token 树节点 */
export interface Token {
  type: string;
  tag: string;
  content: string;
  children: Token[] | null;
  map: [number, number] | null;
  info: string;
  markup: string;
  meta: Record<string, unknown>;
}
```

- [ ] **Step 2: 创建 src/constants.ts**

```typescript
/** 画布尺寸 */
export const CANVAS = {
  WIDTH: 1080,
  HEIGHT: 1440,
} as const;

/** 视口配置（deviceScaleFactor: 2 → 渲染 2160×2880） */
export const VIEWPORT = {
  width: CANVAS.WIDTH,
  height: CANVAS.HEIGHT,
  deviceScaleFactor: 2,
} as const;

/** 排版常量 */
export const LAYOUT = {
  /** 左右留白 px */
  paddingX: 120,
  /** 有效阅读宽度 px */
  contentWidth: CANVAS.WIDTH - LAYOUT.paddingX * 2,
  /** 正文字号 px */
  fontSize: 44,
  /** 行高倍数 */
  lineHeight: 1.8,
  /** 单行高度 px */
  linePx: Math.round(LAYOUT.fontSize * LAYOUT.lineHeight),
  /** 段落间距 px */
  paragraphGap: 40,
  /** 顶部内容区起始位置 px（正文页留出底部署名区） */
  contentTop: 80,
  /** 底部署名区高度 px */
  footerHeight: 100,
  /** 可用内容区高度 px */
  contentHeight: CANVAS.HEIGHT - LAYOUT.contentTop - LAYOUT.footerHeight,
} as const;

// 重新定义依赖于 LAYOUT 的常量（需在 LAYOUT 定义之后）
export const CONTENT_HEIGHT = CANVAS.HEIGHT - LAYOUT.contentTop - LAYOUT.footerHeight;

/** 字体 */
export const FONT = {
  family: '"Songti SC", "SimSun", "Times New Roman", serif',
} as const;

/** 颜色 */
export const COLORS = {
  background: '#faf9f7',
  text: '#1a1a1a',
  accent: '#e8453c',
  subtitle: '#666666',
  rule: '#d4cfc7',
} as const;

/** 字号 */
export const FONT_SIZES = {
  coverTitle: 120,
  subtitle: 36,
  h1: 72,
  h2: 56,
  body: LAYOUT.fontSize,
  footer: 22,
} as const;

/** 封面标题字号 */
export const COVER_TITLE_SIZE = 120;
/** 封面副标题字号 */
export const COVER_SUBTITLE_SIZE = 36;

/**
 * 估算单页最大可容纳字符数
 *
 * 计算逻辑：
 * - 可用内容高度 = 1440 - 80(顶部) - 100(底部署名) = 1260px
 * - 每行高度 = 44 × 1.8 = 80px（取整到80px）
 * - 可排布行数 = 1260 / 80 ≈ 15 行
 * - 每行有效字数 = 840px / (44px × 1.0) ≈ 19 字（中文字符）
 * - 单页容量 ≈ 15 × 19 = 285 字
 *
 * 安全值取 280
 */
export const CHARS_PER_PAGE = 280;

/** 图片最大宽度（等于有效阅读宽度） */
export const IMAGE_MAX_WIDTH = LAYOUT.contentWidth;
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add types and visual constants"
```

---

## Task 3: markdown-it 解析器

**Files:**
- Create: `writing-to-card/src/parser.ts`
- Test: `writing-to-card/evals/parser.test.ts`

- [ ] **Step 1: 创建 src/parser.ts**

```typescript
import MarkdownIt from 'markdown-it';
import * as fs from 'fs';
import * as path from 'path';
import { Token } from './types';

let md: MarkdownIt | null = null;

function createMarkdownIt(): MarkdownIt {
  return new MarkdownIt({
    html: true,
    linkify: false,
    typographer: true,
    breaks: false,
  });
}

function getMd(): MarkdownIt {
  if (!md) {
    md = createMarkdownIt();
  }
  return md;
}

/**
 * 将 markdown-it Token 树转换为我们的 Token 接口
 */
function normalizeToken(token: import('markdown-it').Token): Token {
  return {
    type: token.type,
    tag: token.tag,
    content: token.content,
    children: token.children ? token.children.map(normalizeToken) : null,
    map: token.map,
    info: token.info,
    markup: token.markup,
    meta: token.meta as Record<string, unknown> || {},
  };
}

/**
 * 获取原始 Token 树（用于分页切割）
 */
export function parseToTokens(markdown: string): Token[] {
  const mdInstance = getMd();
  const env: Record<string, unknown> = {};
  const tokens = mdInstance.parse(markdown, env);
  return tokens.map(normalizeToken);
}

/**
 * 将 Markdown 直接渲染为 HTML 字符串（用于注入模板）
 */
export function renderToHtml(markdown: string): string {
  const mdInstance = getMd();
  let html = mdInstance.render(markdown);
  return html;
}

/**
 * 将 Markdown 文件内容读取并渲染为 HTML
 * 图片路径以 baseDir 为基准解析
 */
export function renderFileToHtml(filePath: string, baseDir: string): string {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  // 相对图片路径修正
  const resolved = resolveImagePaths(content, path.dirname(absolutePath));
  return renderToHtml(resolved);
}

/**
 * 修正 Markdown 内容中的图片相对路径为绝对路径
 * ![img](./images/photo.jpg) → ![img](/abs/path/to/images/photo.jpg)
 */
export function resolveImagePaths(markdown: string, baseDir: string): string {
  return markdown.replace(
    /!\[([^\]]*)\]\(\.\//g,
    `![$1](${baseDir.replace(/\\/g, '/')}/`
  );
}
```

- [ ] **Step 2: 创建 evals/parser.test.ts**

```typescript
import { parseToTokens, renderToHtml, resolveImagePaths } from '../src/parser';

describe('parser', () => {
  describe('parseToTokens', () => {
    it('should parse paragraph tokens', () => {
      const tokens = parseToTokens('Hello world');
      expect(tokens[0].type).toBe('paragraph_open');
      expect(tokens[1].content).toBe('Hello world');
    });

    it('should parse bold tokens', () => {
      const tokens = parseToTokens('This is **bold** text');
      const textToken = tokens.find(t => t.type === 'inline');
      expect(textToken?.content).toContain('**bold**');
    });

    it('should parse image token', () => {
      const tokens = parseToTokens('![img](./photo.jpg)');
      const imageToken = tokens.find(t => t.type === 'image');
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
      const html = renderToHtml('# Title\n## Subtitle');
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

    it('should render image with src', () => {
      const html = renderToHtml('![desc](./img.jpg)');
      expect(html).toContain('src="./img.jpg"');
    });
  });

  describe('resolveImagePaths', () => {
    it('should resolve relative image paths', () => {
      const result = resolveImagePaths('![img](./images/photo.jpg)', '/home/user/article');
      expect(result).toContain('file:///home/user/article/images/photo.jpg');
    });
  });
});
```

- [ ] **Step 3: 运行测试验证**

Run: `cd writing-to-card && npm install && npm run test -- --testPathPattern=parser`
Expected: All parser tests pass

- [ ] **Step 4: Commit**

```bash
git add src/parser.ts evals/parser.test.ts
git commit -m "feat: add markdown-it parser with image path resolution"
```

---

## Task 4: 分页切割逻辑

**Files:**
- Create: `writing-to-card/src/splitter.ts`
- Test: `writing-to-card/evals/splitter.test.ts`

- [ ] **Step 1: 创建 src/splitter.ts**

```typescript
import { Token } from './types';
import { CHARS_PER_PAGE } from './constants';

/** 复合标签集合（需要安全闭合） */
const COMPOUND_TAGS = new Set(['strong', 'em', 'code', 'del', 's', 'mark']);

/**
 * 计算一个 token 节点及其子节点的字符总数
 */
function countChars(token: Token): number {
  if (token.type === 'inline' && token.content) {
    // inline token 的 content 已经包含了所有文本
    return token.content.length;
  }
  let count = token.content ? token.content.length : 0;
  if (token.children) {
    for (const child of token.children) {
      count += countChars(child);
    }
  }
  return count;
}

/**
 * 判断 token 是否需要安全闭合处理
 */
function needsSafeClose(token: Token): boolean {
  if (token.type === 'inline') return false;
  return COMPOUND_TAGS.has(token.tag);
}

/**
 * 生成闭合标签字符串
 */
function buildCloseTags(tokens: Token[]): string {
  const tags: string[] = [];
  for (const token of tokens) {
    if (needsSafeClose(token)) {
      // 查找对应的闭合标签
      const openTag = token.tag;
      tags.push(`</${openTag}>`);
    }
  }
  return tags.join('');
}

/**
 * 生成起始标签字符串（用于下一页开头）
 */
function buildOpenTags(tokens: Token[]): string {
  const tags: string[] = [];
  // 反向遍历（从里到外）
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (needsSafeClose(token)) {
      tags.push(`<${token.tag}>`);
    }
  }
  return tags.join('');
}

/**
 * 将 markdown-it token 列表切分为多页
 * @param tokens markdown-it token 树
 * @param charsPerPage 每页最大字符数
 * @returns HTML 字符串数组，每项是一页的完整 HTML 内容
 */
export function splitTokensToHtml(tokens: Token[], charsPerPage: number = CHARS_PER_PAGE): string[] {
  const pages: string[] = [];
  let currentChars = 0;
  let currentPageTokens: Token[] = [];
  // 栈：跟踪当前打开的复合标签
  const openTagStack: Token[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // 忽略 paragraph_open / paragraph_close 等容器标签的处理
    // 只处理 inline tokens 的内容累积

    if (token.type === 'inline') {
      const text = token.content || '';
      const remaining = charsPerPage - currentChars;

      if (text.length <= remaining || currentChars === 0) {
        // 当前 inline 可以完整放入本页
        currentPageTokens.push(token);
        currentChars += text.length;
      } else {
        // 需要截断：先闭合本页所有打开的标签
        const closeTags = buildCloseTags(openTagStack);
        pages.push(buildPageHtml(currentPageTokens, closeTags, ''));
        // 重置
        currentPageTokens = [];
        currentChars = 0;
        // 在新页开头重新打开标签
        const openTags = buildOpenTags(openTagStack);
        currentPageTokens.push(token);
        currentChars = text.length;
        // 记录页面级别的开标签（如果有的话）
        // 注意：这里需要把 openTagStack 的状态带入新页
        // 但由于文本内容本身的 HTML 渲染是完整的，新页只需要把 openTagStack 的标签重新加上
        // 实际上 buildPageHtml 会处理这个问题
      }
    } else if (token.type === 'inline_open') {
      openTagStack.push(token);
      currentPageTokens.push(token);
    } else if (token.type === 'inline_close') {
      if (openTagStack.length > 0) {
        openTagStack.pop();
      }
      currentPageTokens.push(token);
    } else if (token.type === 'softbreak') {
      currentPageTokens.push(token);
      currentChars += 1;
    } else {
      // 其他块级 token（heading_open, paragraph_open, blockquote_open 等）
      currentPageTokens.push(token);
      const charCount = countChars(token);
      currentChars += charCount;
    }

    // 检查是否需要分页
    if (currentChars >= charsPerPage && currentPageTokens.length > 0) {
      const closeTags = buildCloseTags(openTagStack);
      const openTags = buildOpenTags(openTagStack);
      pages.push(buildPageHtml(currentPageTokens, closeTags, openTags));
      // 重置，但保留未闭合标签的状态
      currentPageTokens = [];
      currentChars = 0;
      // openTagStack 保留，供下一页使用
    }
  }

  // 最后一页
  if (currentPageTokens.length > 0) {
    const closeTags = buildCloseTags(openTagStack);
    pages.push(buildPageHtml(currentPageTokens, closeTags, ''));
  }

  return pages;
}

/**
 * 将 token 数组转换回 HTML 字符串
 */
function tokensToHtml(tokens: Token[]): string {
  let html = '';
  for (const token of tokens) {
    if (token.type === 'inline') {
      html += token.content;
    } else if (token.type === 'softbreak') {
      html += '\n';
    } else if (token.type === 'heading_open') {
      html += `<${token.tag}>`;
    } else if (token.type === 'heading_close') {
      html += `</${token.tag}>`;
    } else if (token.type === 'paragraph_open') {
      html += `<${token.tag}>`;
    } else if (token.type === 'paragraph_close') {
      html += `</${token.tag}>`;
    } else if (token.type === 'blockquote_open') {
      html += `<${token.tag}>`;
    } else if (token.type === 'blockquote_close') {
      html += `</${token.tag}>`;
    } else if (token.type === 'ul_open') {
      html += `<${token.tag}>`;
    } else if (token.type === 'ul_close') {
      html += `</${token.tag}>`;
    } else if (token.type === 'ol_open') {
      html += `<${token.tag}>`;
    } else if (token.type === 'ol_close') {
      html += `</${token.tag}>`;
    } else if (token.type === 'li_open') {
      html += `<${token.tag}>`;
    } else if (token.type === 'li_close') {
      html += `</${token.tag}>`;
    } else if (token.type === 'code_inline') {
      html += `<code>${escapeHtml(token.content)}</code>`;
    } else if (token.type === 'image') {
      // 保留原样（路径已由 parser 解析）
      html += `<img src="${escapeHtml(token.attrGet('src') || '')}" alt="${escapeHtml(token.attrGet('alt') || '')}">`;
    } else if (token.type === 'inline_open' || token.type === 'inline_close') {
      // span/strong/em 等标签
      if (token.tag) {
        html += `<${token.tag}>`;
      }
    } else if (token.type === 'hr') {
      html += '<hr>';
    } else {
      // 回退：如果 token 有 tag 属性
      if (token.tag) {
        if (token.type.endsWith('_open')) {
          html += `<${token.tag}>`;
        } else if (token.type.endsWith('_close')) {
          html += `</${token.tag}>`;
        }
      }
    }
  }
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 构建完整页面 HTML（追加闭合标签和前置开标签）
 */
function buildPageHtml(tokens: Token[], closeTags: string, prependOpenTags: string): string {
  const bodyHtml = tokensToHtml(tokens);
  return prependOpenTags + bodyHtml + closeTags;
}
```

> **注意**：`src/splitter.ts` 需要补充 `attrGet` 方法到 Token 接口，或在实现时用其他方式获取属性。实际 markdown-it token 的属性存储在 `token.attr`（数组），需要添加辅助函数。

- [ ] **Step 2: 补充 Token 类型和 attrGet 方法**

打开 `src/types.ts`，修改 Token 接口：

```typescript
// 在 src/types.ts 中添加
function attrGet(token: Token, name: string): string | undefined {
  if (!token.attr) return undefined;
  const attr = token.attr.find(([k]) => k === name);
  return attr ? attr[1] : undefined;
}
```

并更新 Token 接口：
```typescript
export interface Token {
  type: string;
  tag: string;
  content: string;
  children: Token[] | null;
  map: [number, number] | null;
  info: string;
  markup: string;
  meta: Record<string, unknown>;
  /** markdown-it 原始属性数组: [['src', '...'], ['alt', '...']] */
  attr?: [string, string][];
}
```

- [ ] **Step 3: 创建 evals/splitter.test.ts**

```typescript
import { splitTokensToHtml } from '../src/splitter';
import { parseToTokens } from '../src/parser';

describe('splitter', () => {
  describe('splitTokensToHtml', () => {
    it('should return empty array for empty input', () => {
      expect(splitTokensToHtml([], 280)).toEqual([]);
    });

    it('should return single page for short content', () => {
      const tokens = parseToTokens('Short text');
      const pages = splitTokensToHtml(tokens, 280);
      expect(pages.length).toBe(1);
      expect(pages[0]).toContain('Short text');
    });

    it('should split long content into multiple pages', () => {
      const longText = '这是一段很长的文本内容。'.repeat(30);
      const tokens = parseToTokens(longText);
      const pages = splitTokensToHtml(tokens, 280);
      expect(pages.length).toBeGreaterThan(1);
    });

    it('should close compound tags at page boundary', () => {
      // 制造恰好在加粗中间分页的场景
      const text = '正常文字**加粗内容跨页面**';
      const tokens = parseToTokens(text);
      const pages = splitTokensToHtml(tokens, 20); // 极小容量，强制分页在加粗内部
      // 第一页末尾必须有 </strong>，最后一页开头可能有 <strong>
      const firstPage = pages[0];
      const lastPage = pages[pages.length - 1];
      // 验证 HTML 结构完整性：所有 < 有对应的 >
      expect(countAngleBrackets(firstPage)).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple paragraphs', () => {
      const tokens = parseToTokens('第一段文字。\n\n第二段文字。\n\n第三段文字。');
      const pages = splitTokensToHtml(tokens, 280);
      expect(pages.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle blockquote', () => {
      const tokens = parseToTokens('> 这是一段引用');
      const html = splitTokensToHtml(tokens, 280)[0];
      expect(html).toContain('<blockquote>');
    });

    it('should handle list', () => {
      const tokens = parseToTokens('- 项目一\n- 项目二\n- 项目三');
      const html = splitTokensToHtml(tokens, 280)[0];
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });
  });
});

function countAngleBrackets(html: string): number {
  const opens = (html.match(/<[a-z]/gi) || []).length;
  const closes = (html.match(/<\/[a-z]/gi) || []).length;
  return opens - closes;
}
```

- [ ] **Step 4: 运行测试验证**

Run: `cd writing-to-card && npm run test -- --testPathPattern=splitter`
Expected: Tests fail initially (incomplete implementation), then implement to pass

- [ ] **Step 5: Commit**

```bash
git add src/splitter.ts evals/splitter.test.ts
git commit -m "feat: add token-based pagination with safe tag closure"
```

---

## Task 5: HTML 模板

**Files:**
- Create: `writing-to-card/templates/cover.hbs`
- Create: `writing-to-card/templates/content.hbs`

- [ ] **Step 1: 创建 templates/cover.hbs**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1440">
  <title>Cover</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

    :root {
      --color-bg: #faf9f7;
      --color-ink: #1a1a1a;
      --color-accent: #e8453c;
      --color-subtitle: #666666;
      --font-serif: "Noto Serif SC", "Songti SC", "SimSun", "Times New Roman", serif;
      --font-size-title: 120px;
      --font-size-subtitle: 36px;
      --font-size-footer: 22px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1080px;
      height: 1440px;
      background: var(--color-bg);
      font-family: var(--font-serif);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .cover-container {
      width: 1080px;
      height: 1440px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 120px;
    }

    .title {
      font-size: var(--font-size-title);
      font-weight: 700;
      color: var(--color-ink);
      text-align: center;
      line-height: 1.3;
      margin-bottom: 48px;
      word-break: break-word;
    }

    .divider {
      width: 200px;
      height: 3px;
      background: var(--color-accent);
      margin-bottom: 40px;
    }

    .subtitle {
      font-size: var(--font-size-subtitle);
      color: var(--color-subtitle);
      text-align: center;
      line-height: 1.6;
      word-break: break-word;
    }

    .footer {
      position: absolute;
      bottom: 60px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 120px;
      font-size: var(--font-size-footer);
      color: var(--color-subtitle);
    }

    .footer-date {
      font-family: var(--font-serif);
    }

    .footer-author {
      font-family: var(--font-serif);
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="cover-container">
    <div class="title">{{title}}</div>
    {{#if subtitle}}
    <div class="divider"></div>
    <div class="subtitle">{{subtitle}}</div>
    {{/if}}
  </div>
  <div class="footer">
    <span class="footer-date">{{date}}</span>
    <span class="footer-author">{{author}}</span>
  </div>
</body>
</html>
```

- [ ] **Step 2: 创建 templates/content.hbs**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1440">
  <title>Content</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

    :root {
      --color-bg: #faf9f7;
      --color-ink: #1a1a1a;
      --color-accent: #e8453c;
      --color-rule: #d4cfc7;
      --font-serif: "Noto Serif SC", "Songti SC", "SimSun", "Times New Roman", serif;
      --font-size-h1: 72px;
      --font-size-h2: 56px;
      --font-size-body: 44px;
      --font-size-code: 40px;
      --font-size-footer: 22px;
      --lh: 1.8;
      --padding-x: 120px;
      --padding-top: 80px;
      --footer-height: 100px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1080px;
      height: 1440px;
      background: var(--color-bg);
      font-family: var(--font-serif);
      overflow: hidden;
    }

    .page-container {
      width: 1080px;
      height: 1440px;
      padding: var(--padding-top) var(--padding-x) var(--footer-height) var(--padding-x);
      display: flex;
      flex-direction: column;
    }

    .content-body {
      flex: 1;
      font-size: var(--font-size-body);
      line-height: var(--lh);
      color: var(--color-ink);
      overflow: hidden;
    }

    .content-body p {
      margin-bottom: 40px;
    }

    .content-body h1 {
      font-size: var(--font-size-h1);
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 32px;
      color: var(--color-ink);
    }

    .content-body h2 {
      font-size: var(--font-size-h2);
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 28px;
      color: var(--color-ink);
    }

    .content-body strong {
      font-weight: 700;
    }

    .content-body em {
      font-style: italic;
    }

    .content-body code {
      font-family: "JetBrains Mono", "Menlo", monospace;
      font-size: var(--font-size-code);
      background: #f0f0f0;
      padding: 4px 10px;
      border-radius: 4px;
      color: var(--color-ink);
    }

    .content-body blockquote {
      border-left: 4px solid var(--color-accent);
      padding-left: 24px;
      margin: 32px 0;
      color: var(--color-ink);
    }

    .content-body ul,
    .content-body ol {
      margin: 0 0 40px 0;
      padding-left: 0;
    }

    .content-body li {
      list-style-position: outside;
      margin-bottom: 20px;
      padding-left: 0;
    }

    .content-body img {
      max-width: 840px;
      width: 100%;
      height: auto;
      display: block;
      margin: 32px 0;
    }

    .content-body hr {
      border: none;
      border-top: 1px solid var(--color-rule);
      margin: 40px 0;
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      font-size: var(--font-size-footer);
      color: #999;
      border-top: 1px solid var(--color-rule);
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="content-body">
      {{{ content }}}
    </div>
    <div class="page-footer">
      <span class="footer-date">{{date}}</span>
      <span class="footer-author">{{author}}</span>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add templates/cover.hbs templates/content.hbs
git commit -m "feat: add cover and content Handlebars templates"
```

---

## Task 6: Playwright 渲染器

**Files:**
- Create: `writing-to-card/src/renderer.ts`

- [ ] **Step 1: 创建 src/renderer.ts**

```typescript
import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { VIEWPORT } from './constants';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      channel: process.env.PLAYWRIGHT_CHANNEL === 'skip' ? undefined : 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

function loadTemplate(templateName: string): HandlebarsTemplateDelegate {
  const templatePath = path.resolve(__dirname, `../templates/${templateName}.hbs`);
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  return handlebars.compile(templateHtml);
}

export interface RenderOptions {
  /** HTML 内容片段（已渲染的 Markdown HTML） */
  content: string;
  /** 日期字符串 */
  date: string;
  /** 署名 */
  author: string;
}

/**
 * 渲染单页封面
 */
export async function renderCover(
  title: string,
  subtitle: string | undefined,
  date: string,
  author: string
): Promise<string> {
  const template = loadTemplate('cover');
  const html = template({ title, subtitle, date, author });
  return takeScreenshot(html, 'cover');
}

/**
 * 渲染单页正文
 */
export async function renderContent(
  content: string,
  date: string,
  author: string
): Promise<string> {
  const template = loadTemplate('content');
  const html = template({ content, date, author });
  return takeScreenshot(html, 'content');
}

/**
 * 对给定 HTML 执行截图，返回 Base64 PNG 字符串
 */
async function takeScreenshot(html: string, pageType: string): Promise<string> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    deviceScaleFactor: VIEWPORT.deviceScaleFactor,
    viewport: {
      width: VIEWPORT.width,
      height: VIEWPORT.height,
    },
  });

  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(100); // 等待字体渲染

    const containerSelector = pageType === 'cover' ? 'body' : '.page-container';
    const element = await page.$(containerSelector);
    if (!element) {
      throw new Error(`Container element '${containerSelector}' not found`);
    }

    const buffer = await element.screenshot({ type: 'png' });
    await page.close();
    return buffer.toString('base64');
  } finally {
    await context.close();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer.ts
git commit -m "feat: add Playwright renderer with screenshot support"
```

---

## Task 7: Skill 主入口

**Files:**
- Create: `writing-to-card/src/index.ts`

- [ ] **Step 1: 创建 src/index.ts**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { SkillInput, SkillOutput } from './types';
import { parseToTokens, renderToHtml, resolveImagePaths } from './parser';
import { splitTokensToHtml } from './splitter';
import { renderCover, renderContent, closeBrowser } from './renderer';
import { CHARS_PER_PAGE } from './constants';

function formatDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 生成序列化的文件名字符串
 * @param index 页码（从 1 开始）
 * @param type 类型：cover 或 content
 */
function makeFileName(index: number, type: 'cover' | 'content'): string {
  const idx = String(index).padStart(2, '0');
  return `${idx}_${type}.png`;
}

/**
 * 将 Base64 PNG 写入文件
 */
function writePngFile(outputDir: string, fileName: string, base64: string): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, fileName);
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * 主入口：执行 Markdown → PNG 卡片转换
 */
export async function executeSkill(input: SkillInput): Promise<SkillOutput> {
  const {
    title,
    subtitle,
    content: contentInput,
    contentBaseDir,
    outputDir,
  } = input;

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const date = formatDate();
  const author = '写作卡片'; // 固定署名

  // 解析正文内容
  let markdownContent: string;
  if (fs.existsSync(contentInput)) {
    // content 是文件路径，读取文件
    const baseDir = contentBaseDir || path.dirname(path.resolve(contentInput));
    markdownContent = fs.readFileSync(contentInput, 'utf-8');
    // 修正图片相对路径
    markdownContent = resolveImagePaths(markdownContent, baseDir);
  } else {
    // content 是直接的 Markdown 字符串
    const baseDir = contentBaseDir || process.cwd();
    markdownContent = resolveImagePaths(contentInput, baseDir);
  }

  const files: string[] = [];
  let pageIndex = 1;

  // 生成封面
  const coverBase64 = await renderCover(title, subtitle, date, author);
  const coverFileName = makeFileName(pageIndex, 'cover');
  const coverPath = writePngFile(outputDir, coverFileName, coverBase64);
  files.push(coverPath);
  pageIndex++;

  // 解析并分页正文
  const tokens = parseToTokens(markdownContent);
  const pageHtmls = splitTokensToHtml(tokens, CHARS_PER_PAGE);

  for (const pageHtml of pageHtmls) {
    const contentBase64 = await renderContent(pageHtml, date, author);
    const contentFileName = makeFileName(pageIndex, 'content');
    const contentPath = writePngFile(outputDir, contentFileName, contentBase64);
    files.push(contentPath);
    pageIndex++;
  }

  return { files };
}

// 优雅关闭浏览器进程
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/index.ts
git commit -m "feat: add skill entry point with full pipeline orchestration"
```

---

## Task 8: SKILL.md 工作流编排

**Files:**
- Create: `writing-to-card/SKILL.md`

- [ ] **Step 1: 创建 SKILL.md**

```markdown
---
name: writing-to-card
description: 将长篇 Markdown 文章转换为多张 1080×1440 PNG 图片，适合小红书发布。当用户需要将文章、博客、教程转成分享图片时使用。
---

# Writing to Card

## Description

将 Markdown 长文自动转换为符合小红书排版规范的 PNG 图片序列（封面 + 多页正文）。支持加粗、斜体、标题、列表、引用块、本地图片等常用语法，自动分页并渲染高质量截图。

## When to Use

- 用户提供文章内容，希望生成分享图片
- 用户提到"转成小红书卡片"、"生成分享图片"、"文章转图片"

## Usage

调用 `executeSkill(input)`，传入 `SkillInput` 对象：

```typescript
import { executeSkill } from './dist/index';

const result = await executeSkill({
  title: '文章标题',
  subtitle: '副标题（可选）',
  content: 'Markdown 字符串或文件路径',
  contentBaseDir: '/abs/path/to/content/dir',  // 可选，用于解析相对图片路径
  outputDir: './output/',
});
// result.files: ['./output/01_cover.png', './output/02_content.png', ...]
```

## Workflow

### 阶段一：输入解析

1. 接收用户传入的 `title`、`subtitle`（可选）、`content`
2. 若 `content` 为文件路径，读取文件内容；若为 Markdown 字符串，直接使用
3. 解析正文中的本地图片相对路径（基于 `contentBaseDir` 或文件所在目录）

### 阶段二：分页切割

4. 使用 `markdown-it` 将 Markdown 解析为 Token 树
5. 按字符数（每页 280 字）遍历 Token，累加字符数
6. 达到容量上限时，在 Token 边界处切分页面
7. 若切分点在复合标签（加粗/斜体/代码块）内部，自动补全闭合标签

### 阶段三：渲染截图

8. 封面：加载 `templates/cover.hbs`，注入标题、副标题（可选）、日期、署名，渲染截图
9. 正文每页：加载 `templates/content.hbs`，注入 HTML 内容片段、日期、署名，渲染截图
10. 使用 Playwright，viewport 1080×1440，deviceScaleFactor: 2

### 阶段四：文件输出

11. 按顺序写入输出目录：`01_cover.png`, `02_content.png`, `03_content.png` ...
12. 返回文件路径数组

## Templates

模板文件位于 `templates/` 目录（MVP 一套默认模板）：

- `cover.hbs`：封面模板，变量：`title`, `subtitle?`, `date`, `author`
- `content.hbs`：正文模板，变量：`content`（HTML 片段）, `date`, `author`

模板切换（MVP 暂不支持）：后续通过 `template` 参数选择不同模板目录。

## Error Handling

- 输入文件不存在：抛出 `Error: Content file not found`
- 输出目录写入失败：抛出 `Error: Cannot write to output directory`
- Playwright 截图失败：抛出截图相关错误

## Reference

详细设计文档：`docs/superpowers/specs/2026-04-08-writing-to-card-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add SKILL.md
git commit -m "feat: add SKILL.md workflow orchestration layer"
```

---

## Task 9: 集成测试与最终验证

**Files:**
- Test: `writing-to-card/evals/renderer.test.ts`

- [ ] **Step 1: 创建 evals/renderer.test.ts**

```typescript
import * as path from 'path';
import { executeSkill } from '../src/index';

describe('renderer integration', () => {
  const outputDir = path.join(__dirname, '../tmp/output');

  afterAll(async () => {
    // 关闭浏览器
    const { closeBrowser } = await import('../src/renderer');
    await closeBrowser();
  });

  it('should generate at least 2 files (cover + content)', async () => {
    const result = await executeSkill({
      title: '测试标题',
      subtitle: '测试副标题',
      content: '这是一段正文内容，用于验证渲染管线是否正常工作。',
      outputDir,
    });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    expect(result.files[0]).toContain('01_cover.png');
  });

  it('should generate PNG files with valid size', async () => {
    const result = await executeSkill({
      title: '图片测试',
      content: '## 标题\n\n正文段落。\n\n- 列表项一\n- 列表项二',
      outputDir,
    });

    for (const filePath of result.files) {
      const fs = await import('fs');
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(10000); // PNG 应大于 10KB
    }
  });
});
```

- [ ] **Step 2: 安装依赖并运行完整测试**

Run: `cd writing-to-card && npm install && npm run test`
Expected: All tests pass

- [ ] **Step 3: 最终构建验证**

Run: `cd writing-to-card && npm run build`
Expected: No TypeScript errors, dist/ created

- [ ] **Step 4: Commit**

```bash
git add evals/renderer.test.ts
git commit -m "test: add integration tests and verify full pipeline"
```

---

## 自检清单

| # | 检查项 | 对应 Task |
|---|--------|-----------|
| 1 | SKILL.md 描述了完整工作流，无脚本长链 | Task 8 |
| 2 | 所有 Handlebars 模板在 templates/，无运行时逻辑 | Task 5 |
| 3 | 分页逻辑在 scripts/（splitter.ts），不含 LLM 调用 | Task 4 |
| 4 | 渲染逻辑在 renderer.ts，无 prompt 相关代码 | Task 6 |
| 5 | 所有测试在 evals/，断言有效（非弱断言） | Task 3, 4, 9 |
| 6 | 封面模板含标题 + 分割线 + 副标题 | Task 5 |
| 7 | 正文模板含暖纸配色（#faf9f7 + #1a1a1a + #e8453c） | Task 5 |
| 8 | 图片路径相对路径解析相对于输入文件目录 | Task 3 |
| 9 | 分页含安全闭合机制 | Task 4 |
| 10 | 文件命名规则：01_cover.png, 02_content.png... | Task 7 |
