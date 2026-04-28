import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, PhrasingContent, BlockContent, DefinitionContent, List, Blockquote, Code, Image } from 'mdast';
import type { DocumentModel, Block, Inline, HeadingBlock, ParagraphBlock, ListBlock, ListItemBlock, QuoteBlock, CodeBlock, HrBlock, ImageBlock } from './types.js';

/**
 * 将 Remark AST 转换为 DocumentModel
 */
export function parseMarkdown(content: string, title: string, baseDir: string): DocumentModel {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const ast = processor.parse(content) as Root;

  const blocks: Block[] = [];
  for (const node of ast.children) {
    if (isBlockContent(node)) {
      blocks.push(convertNode(node, baseDir));
    } else if (isImage(node)) {
      blocks.push(convertImageNode(node));
    }
  }

  return { title, blocks, baseDir };
}

function isBlockContent(node: unknown): node is BlockContent {
  if (!node || typeof node !== 'object') return false;
  const n = node as { type?: string };
  return [
    'paragraph', 'heading', 'list', 'blockquote',
    'code', 'html', 'thematicBreak', 'table'
  ].includes(n.type || '');
}

function isImage(node: unknown): node is Image {
  if (!node || typeof node !== 'object') return false;
  return (node as { type?: string }).type === 'image';
}

function isPhrasingContent(node: unknown): node is PhrasingContent {
  if (!node || typeof node !== 'object') return false;
  const n = node as { type?: string };
  return [
    'text', 'strong', 'emphasis', 'inlineCode',
    'link', 'image'
  ].includes(n.type || '');
}

function convertNode(node: BlockContent, baseDir: string): Block {
  const n = node as { type?: string };
  switch (n.type) {
    case 'heading':
      return convertHeading(node as { type: 'heading'; depth: 1 | 2 | 3 | 4 | 5 | 6; children: PhrasingContent[] });
    case 'paragraph':
      return convertParagraph(node as { type: 'paragraph'; children: PhrasingContent[] }, baseDir);
    case 'list':
      return convertList(node as List, baseDir);
    case 'blockquote':
      return convertQuote(node as Blockquote, baseDir);
    case 'code':
      return convertCode(node as Code);
    case 'thematicBreak':
      return { type: 'hr' };
    case 'html':
      return {
        type: 'paragraph',
        inlines: [{ type: 'text', value: (node as { value: string }).value }]
      };
    case 'table':
      return {
        type: 'paragraph',
        inlines: [{ type: 'text', value: '[Table not supported]' }]
      };
    default:
      return {
        type: 'paragraph',
        inlines: [{ type: 'text', value: '[Unsupported content]' }]
      };
  }
}

function convertImageNode(node: Image): ImageBlock {
  return {
    type: 'image',
    src: node.url,
    alt: node.alt ?? undefined,
    title: node.title ?? undefined,
  };
}

function convertHeading(node: { type: 'heading'; depth: 1 | 2 | 3 | 4 | 5 | 6; children: PhrasingContent[] }): HeadingBlock {
  return {
    type: 'heading',
    level: node.depth as 1 | 2 | 3,
    inlines: convertInlines(node.children),
  };
}

function convertParagraph(node: { type: 'paragraph'; children: PhrasingContent[] }, baseDir: string): ParagraphBlock {
  return {
    type: 'paragraph',
    inlines: convertInlines(node.children, baseDir),
  };
}

function convertInlines(nodes: PhrasingContent[], _baseDir?: string): Inline[] {
  const inlines: Inline[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        inlines.push({ type: 'text', value: node.value });
        break;
      case 'strong':
        inlines.push({ type: 'strong', children: convertInlines(node.children) });
        break;
      case 'emphasis':
        inlines.push({ type: 'emphasis', children: convertInlines(node.children) });
        break;
      case 'inlineCode':
        inlines.push({ type: 'inlineCode', value: node.value });
        break;
      case 'link':
        if (node.children.length > 0) {
          inlines.push(...convertInlines(node.children));
        }
        break;
      case 'image':
        break;
    }
  }

  return inlines;
}

function convertList(node: List, baseDir: string): ListBlock {
  return {
    type: 'list',
    ordered: node.ordered ?? false,
    start: node.start ?? undefined,
    items: node.children.map(item => convertListItem(item, baseDir)),
  };
}

function convertListItem(node: { type: 'listItem'; children: (BlockContent | DefinitionContent)[] }, baseDir: string): ListItemBlock {
  const blocks: ListItemBlock['blocks'] = [];

  for (const child of node.children) {
    if (!isBlockContent(child) && !isImage(child)) continue;
    if (child.type === 'paragraph' && child.children.length > 0) {
      blocks.push(convertParagraph(child, baseDir));
    } else if (child.type === 'code') {
      blocks.push(convertCode(child as Code));
    } else if (child.type === 'blockquote') {
      blocks.push(convertQuote(child as Blockquote, baseDir));
    }
  }

  return { blocks };
}

function convertQuote(node: Blockquote, baseDir: string): QuoteBlock {
  return {
    type: 'blockquote',
    blocks: node.children
      .filter((child): child is BlockContent => isBlockContent(child))
      .map(child => convertNode(child, baseDir)),
  };
}

function convertCode(node: Code): CodeBlock {
  return {
    type: 'code',
    language: node.lang ?? undefined,
    value: node.value,
  };
}

function convertImage(node: Image): ImageBlock {
  return {
    type: 'image',
    src: node.url,
    alt: node.alt ?? undefined,
    title: node.title ?? undefined,
  };
}

/**
 * 从 DocumentModel 中提取封面标题
 */
export function extractTitle(document: DocumentModel): string {
  for (const block of document.blocks) {
    if (block.type === 'heading' && block.level === 1) {
      return inlineToText(block.inlines);
    }
  }
  return document.title;
}

/**
 * 从 DocumentModel 中提取封面预览文本
 */
export function extractPreviewText(document: DocumentModel, theme: string = 'default'): string {
  const maxLines = {
    apple: 8,
    claude: 10,
    default: 6,
  }[theme] || 6;

  const lines: string[] = [];
  let lineCount = 0;

  for (const block of document.blocks) {
    // 跳过标题本身
    if (block.type === 'heading') continue;

    // 获取段落的纯文本
    if (block.type === 'paragraph') {
      const text = inlineToText(block.inlines).trim();
      if (text) {
        lines.push(text);
        lineCount++;
        if (lineCount >= maxLines) break;
      }
    }

    // 引用块也加入预览
    if (block.type === 'blockquote' && lineCount < maxLines) {
      for (const b of block.blocks) {
        if (b.type === 'paragraph') {
          const text = inlineToText(b.inlines).trim();
          if (text) {
            lines.push(text);
            lineCount++;
            if (lineCount >= maxLines) break;
          }
        }
      }
    }

    if (lineCount >= maxLines) break;
  }

  return lines.join(' ');
}

function inlineToText(inlines: Inline[]): string {
  return inlines.map(inline => {
    switch (inline.type) {
      case 'text':
        return inline.value;
      case 'strong':
        return inlineToText(inline.children);
      case 'emphasis':
        return inlineToText(inline.children);
      case 'inlineCode':
        return inline.value;
    }
  }).join('');
}