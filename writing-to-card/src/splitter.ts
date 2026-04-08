import { Token } from './types';
import { CHARS_PER_PAGE } from './constants';

/**
 * Split markdown-it tokens into multiple HTML page strings.
 *
 * Architecture:
 * - Block-level tokens (paragraph, heading, blockquote, list) are tracked for
 *   prepending their opening tags to the next page when a split happens mid-block.
 * - Inline formatting tokens (strong, em, code) are tracked in openInlineStack.
 *   When a split happens mid-inline, we close all open tags at end of current
 *   page and reopen them at start of next page (safe closure).
 * - The inline token's children are processed as a stream of child tokens,
 *   enabling fine-grained character-level splitting.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Compound tags that need safe open/close across page boundaries */
const COMPOUND_TAGS = new Set(['strong', 'em', 'code', 'del', 's', 'mark', 'span', 'a']);

/** HTML-escape a string for safe insertion into HTML text nodes. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Count the visible character length of an inline child token.
 */
function childTokenChars(token: Token): number {
  return (token.content ?? '').length;
}

// ─── Token → HTML rendering ─────────────────────────────────────────────────

/**
 * Convert an inline child token (text, strong_open, em_close, etc.) to HTML.
 * Does NOT handle block-level tokens.
 */
function childTokenToHtml(token: Token): string {
  switch (token.type) {
    case 'text':
      return escapeHtml(token.content ?? '');
    case 'softbreak':
      return '\n';
    case 'hardbreak':
      return '<br>\n';
    case 'code_inline':
      return `<code>${escapeHtml(token.content ?? '')}</code>`;
    default: {
      // strong_open, em_open, etc.
      if (token.type.endsWith('_open') && token.tag) {
        return `<${token.tag}>`;
      }
      // strong_close, em_close, etc.
      if (token.type.endsWith('_close') && token.tag) {
        return `</${token.tag}>`;
      }
      return '';
    }
  }
}

/**
 * Check whether a block-level open token should be tracked for prepending
 * to the next page when a flush happens mid-block.
 */
function isBlockOpen(token: Token): boolean {
  return (
    token.type === 'paragraph_open' ||
    token.type === 'heading_open' ||
    token.type === 'blockquote_open'
  );
}

/**
 * Convert a top-level token to its HTML representation for the output page.
 */
function tokenToHtml(token: Token): string {
  switch (token.type) {
    case 'inline':
      // Inline tokens should have been processed via children in the main loop;
      // fallback: render children if available.
      if (token.children && token.children.length > 0) {
        return renderInlineChildren(token.children);
      }
      return escapeHtml(token.content ?? '');
    // Block-level open
    case 'paragraph_open':
    case 'heading_open':
    case 'blockquote_open':
      return `<${token.tag}>`;
    // Block-level close
    case 'paragraph_close':
    case 'heading_close':
    case 'blockquote_close':
      return `</${token.tag}>`;
    // List tokens
    case 'bullet_list_open':
      return '<ul>';
    case 'ordered_list_open':
      return '<ol>';
    case 'bullet_list_close':
      return '</ul>';
    case 'ordered_list_close':
      return '</ol>';
    case 'list_item_open':
      return '<li>';
    case 'list_item_close':
      return '</li>';
    // Image
    case 'image':
    case 'img_rendered':
      return escapeHtml(token.content ?? '');
    case 'hr':
    case 'hr_rendered':
      return '<hr>';
    case 'fence':
      return '';
    // Child tokens (may appear as standalone tokens in some flows)
    case 'text':
    case 'softbreak':
    case 'hardbreak':
    case 'code_inline':
      return childTokenToHtml(token);
    default: {
      if (token.type.endsWith('_open') && token.tag) {
        return `<${token.tag}>`;
      }
      if (token.type.endsWith('_close') && token.tag) {
        return `</${token.tag}>`;
      }
      return '';
    }
  }
}

/**
 * Render inline token children to an HTML string.
 */
function renderInlineChildren(children: Token[]): string {
  let html = '';
  for (const child of children) {
    html += childTokenToHtml(child);
  }
  return html;
}

/**
 * Convert a list of tokens to a page HTML string.
 */
function tokensToHtml(tokens: Token[]): string {
  let html = '';
  for (const token of tokens) {
    html += tokenToHtml(token);
  }
  return html;
}

// ─── Page flushing ────────────────────────────────────────────────────────────

/**
 * Build the HTML close tag string for all currently open inline tokens (in reverse order).
 */
function buildInlineCloseMarkup(openInlineStack: Token[]): string {
  return openInlineStack
    .slice()
    .reverse()
    .map(t => `</${t.tag}>`)
    .join('');
}

/**
 * Build the HTML close tag string for all open block-level tokens (in reverse order).
 * Call this when flushing mid-block so the current page ends with balanced tags.
 */
function buildBlockCloseMarkup(openBlockStack: Token[]): string {
  return openBlockStack
    .slice()
    .reverse()
    .map(t => `</${t.tag}>`)
    .join('');
}

/**
 * Prepend block open tags and inline open tags to the current page token list.
 * These restore the HTML structure at the top of the new page after a split.
 */
function prependOpenTags(
  tokens: Token[],
  openBlockStack: Token[],
  openInlineStack: Token[],
): void {
  for (const openTag of openBlockStack) {
    tokens.unshift(openTag);
  }
  for (const openTag of openInlineStack) {
    tokens.unshift(openTag);
  }
}

/**
 * Emit the current page to the pages array.
 * `inlineCloseMarkup` is appended (e.g. </strong> for safe inline closure).
 * `blockCloseMarkup` is appended too (e.g. </p> when flushing mid-paragraph).
 */
function flushPage(
  pages: string[],
  tokens: Token[],
  inlineCloseMarkup: string,
  blockCloseMarkup: string,
): void {
  const bodyHtml = tokensToHtml(tokens);
  pages.push(bodyHtml + inlineCloseMarkup + blockCloseMarkup);
}

// ─── Main splitting algorithm ────────────────────────────────────────────────

/**
 * Split markdown-it tokens into multiple HTML page strings.
 * Handles safe closure of inline formatting (bold, italic, code) across page boundaries.
 */
export function splitTokensToPages(
  tokens: Token[],
  charsPerPage: number = CHARS_PER_PAGE,
): string[] {
  const pages: string[] = [];

  let currentChars = 0;
  /** Tokens accumulated for the current page */
  let currentPageTokens: Token[] = [];

  /**
   * Stack of open inline formatting tags (strong, em, code) that need to be
   * closed at end of current page and reopened at start of next page.
   */
  const openInlineStack: Token[] = [];

  /**
   * Block-level tags that are currently open. When we flush mid-paragraph,
   * we keep them here so the next page can prepend their opening tags.
   */
  const openBlockStack: Token[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // ── Inline token: process children as a character stream ────────────────
    if (token.type === 'inline') {
      const children = token.children ?? [];
      let childIdx = 0;

      while (childIdx < children.length) {
        const child = children[childIdx];
        const childLen = childTokenChars(child);
        const remaining = charsPerPage - currentChars;

        // ── Page is full — flush, then continue with same child ─────────────
        if (remaining <= 0) {
          const savedInlineStack = [...openInlineStack];
          const inlineClose = buildInlineCloseMarkup(savedInlineStack);
          const blockClose = buildBlockCloseMarkup(openBlockStack);
          flushPage(pages, currentPageTokens, inlineClose, blockClose);
          currentPageTokens = [];
          currentChars = 0;
          openInlineStack.length = 0;
          // Prepend block opens to the new page so HTML structure is restored.
          // Keep openBlockStack intact — its tags will be closed on the next flush.
          prependOpenTags(currentPageTokens, openBlockStack, savedInlineStack);
          // Restore inline stack so subsequent children know which tags are still open
          for (const t of savedInlineStack) openInlineStack.push(t);
          continue;
        }

        // ── Text / content child ───────────────────────────────────────────
        if (child.type === 'text' || child.type === 'softbreak' || child.type === 'hardbreak') {
          // If this child doesn't fit, flush and retry (may need multiple flushes for very long text)
          while (childLen > charsPerPage - currentChars && currentChars > 0) {
            const savedInlineStack = [...openInlineStack];
            const inlineClose = buildInlineCloseMarkup(savedInlineStack);
            const blockClose = buildBlockCloseMarkup(openBlockStack);
            flushPage(pages, currentPageTokens, inlineClose, blockClose);
            currentPageTokens = [];
            currentChars = 0;
            openInlineStack.length = 0;
            prependOpenTags(currentPageTokens, openBlockStack, savedInlineStack);
            for (const t of savedInlineStack) openInlineStack.push(t);
          }
          if (childLen > charsPerPage - currentChars && currentChars === 0) {
            // Text alone exceeds one page — chunk it into charsPerPage-sized pieces
            let textRemaining = child.content ?? '';
            while (textRemaining.length > 0) {
              const chunkSize = Math.min(textRemaining.length, charsPerPage);
              const chunk = { ...child, content: textRemaining.slice(0, chunkSize) };
              textRemaining = textRemaining.slice(chunkSize);
              currentPageTokens.push(chunk);
              currentChars += chunkSize;
              if (currentChars >= charsPerPage && textRemaining.length > 0) {
                const savedInlineStack = [...openInlineStack];
                const inlineClose = buildInlineCloseMarkup(savedInlineStack);
                const blockClose = buildBlockCloseMarkup(openBlockStack);
                flushPage(pages, currentPageTokens, inlineClose, blockClose);
                currentPageTokens = [];
                currentChars = 0;
                openInlineStack.length = 0;
                prependOpenTags(currentPageTokens, openBlockStack, savedInlineStack);
                for (const t of savedInlineStack) openInlineStack.push(t);
              }
            }
          } else {
            currentPageTokens.push(child);
            currentChars += childLen;
          }
          childIdx++;
          continue;
        }

        // ── Inline formatting open (strong_open, em_open) ───────────────────────
        // NOTE: code_inline is self-contained and renders as <code>...</code> in one token,
        // so it does NOT need tracking in the openInlineStack.
        if (child.type.endsWith('_open') && COMPOUND_TAGS.has(child.tag)) {
          openInlineStack.push(child);
          currentPageTokens.push(child);
          currentChars += childLen;
          childIdx++;
          continue;
        }

        // ── Inline formatting close (strong_close, em_close) ───────────────
        if (child.type.endsWith('_close') && COMPOUND_TAGS.has(child.tag)) {
          currentPageTokens.push(child);
          currentChars += childLen;
          // Pop matching open from stack (LIFO)
          for (let j = openInlineStack.length - 1; j >= 0; j--) {
            if (openInlineStack[j].tag === child.tag) {
              openInlineStack.splice(j, 1);
              break;
            }
          }
          childIdx++;
          continue;
        }

        // ── Inline code (self-contained: renders as <code>...</code>) ───────────
        if (child.type === 'code_inline') {
          currentPageTokens.push(child);
          currentChars += childLen;
          childIdx++;
          continue;
        }

        // Unknown child type — skip
        childIdx++;
      }
      // Inline token fully processed; move to next top-level token
      continue;
    }

    // ── Block-level open tokens ─────────────────────────────────────────────
    if (isBlockOpen(token)) {
      currentPageTokens.push(token);
      openBlockStack.push(token);
      continue;
    }

    // ── Block-level close tokens ──────────────────────────────────────────
    if (
      token.type === 'paragraph_close' ||
      token.type === 'heading_close' ||
      token.type === 'blockquote_close'
    ) {
      // Pop matching open from block stack
      const openType = token.type.replace('_close', '_open');
      for (let j = openBlockStack.length - 1; j >= 0; j--) {
        if (openBlockStack[j].type === openType) {
          openBlockStack.splice(j, 1);
          break;
        }
      }
      currentPageTokens.push(token);
      continue;
    }

    // ── List tokens ───────────────────────────────────────────────────────
    if (
      token.type === 'bullet_list_open' ||
      token.type === 'ordered_list_open' ||
      token.type === 'bullet_list_close' ||
      token.type === 'ordered_list_close' ||
      token.type === 'list_item_open' ||
      token.type === 'list_item_close'
    ) {
      currentPageTokens.push(token);
      continue;
    }

    // ── Image token ─────────────────────────────────────────────────────────
    if (token.type === 'image') {
      const src = token.attr ? (token.attr.find(([k]) => k === 'src')?.[1] ?? '') : '';
      const alt = token.attr ? (token.attr.find(([k]) => k === 'alt')?.[1] ?? '') : '';
      const imgHtml = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
      const tokenChars = imgHtml.length;

      if (currentChars + tokenChars > charsPerPage && currentChars > 0) {
        const savedInlineStack = [...openInlineStack];
        const inlineClose = buildInlineCloseMarkup(savedInlineStack);
        const blockClose = buildBlockCloseMarkup(openBlockStack);
        flushPage(pages, currentPageTokens, inlineClose, blockClose);
        currentPageTokens = [];
        currentChars = 0;
        openInlineStack.length = 0;
        openBlockStack.length = 0;
        prependOpenTags(currentPageTokens, savedInlineStack, openBlockStack);
      }
      currentPageTokens.push({ ...token, content: imgHtml, type: 'img_rendered' });
      currentChars += tokenChars;
      continue;
    }

    // ── HR ────────────────────────────────────────────────────────────────
    if (token.type === 'hr') {
      if (currentChars + 4 > charsPerPage && currentChars > 0) {
        const savedInlineStack = [...openInlineStack];
        const inlineClose = buildInlineCloseMarkup(savedInlineStack);
        const blockClose = buildBlockCloseMarkup(openBlockStack);
        flushPage(pages, currentPageTokens, inlineClose, blockClose);
        currentPageTokens = [];
        currentChars = 0;
        openInlineStack.length = 0;
        openBlockStack.length = 0;
        prependOpenTags(currentPageTokens, savedInlineStack, openBlockStack);
      }
      currentPageTokens.push({ ...token, content: '<hr>', type: 'hr_rendered' });
      currentChars += 4;
      continue;
    }

    // ── Code fence (skip for MVP) ─────────────────────────────────────────
    if (token.type === 'fence') {
      continue;
    }
  }

  // ── Final page ──────────────────────────────────────────────────────────
  if (currentPageTokens.length > 0) {
    const inlineClose = buildInlineCloseMarkup(openInlineStack);
    const blockClose = buildBlockCloseMarkup(openBlockStack);
    flushPage(pages, currentPageTokens, inlineClose, blockClose);
  }

  return pages;
}
