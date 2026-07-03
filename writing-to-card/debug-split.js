// Debug script for page 4-5 boundary
const fs = require('fs');
const { parseToTokens } = require('./dist/parser');

const md = fs.readFileSync('设计稿，还是不是一张图？-v4.md', 'utf8');
const tokens = parseToTokens(md);
const CHARS_PER_PAGE = 255;
const COMPOUND_TAGS = new Set(['strong', 'em', 'code', 'del', 's', 'mark', 'span', 'a']);

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function childTokenChars(token) {
  return (token.content ?? '').length;
}

function childTokenToHtml(token) {
  switch (token.type) {
    case 'text': return escapeHtml(token.content ?? '');
    case 'softbreak': return '\n';
    case 'hardbreak': return '<br>\n';
    case 'code_inline': return '<code>' + escapeHtml(token.content ?? '') + '</code>';
    default: {
      if (token.type.endsWith('_open') && token.tag) return '<' + token.tag + '>';
      if (token.type.endsWith('_close') && token.tag) return '</' + token.tag + '>';
      return '';
    }
  }
}

function isBlockOpen(token) {
  return token.type === 'paragraph_open' || token.type === 'heading_open' || token.type === 'blockquote_open';
}

function tokenToHtml(token) {
  switch (token.type) {
    case 'inline':
      if (token.children && token.children.length > 0) {
        let html = '';
        for (const c of token.children) html += childTokenToHtml(c);
        return html;
      }
      return escapeHtml(token.content ?? '');
    case 'paragraph_open':
    case 'heading_open':
    case 'blockquote_open':
      return '<' + token.tag + '>';
    case 'paragraph_close':
    case 'heading_close':
    case 'blockquote_close':
      return '</' + token.tag + '>';
    case 'bullet_list_open': return '<ul>';
    case 'ordered_list_open': return '<ol>';
    case 'bullet_list_close': return '</ul>';
    case 'ordered_list_close': return '</ol>';
    case 'list_item_open': return '<li>';
    case 'list_item_close': return '</li>';
    case 'image': return '';
    case 'hr': return '<hr>';
    default: {
      if (token.type.endsWith('_open') && token.tag) return '<' + token.tag + '>';
      if (token.type.endsWith('_close') && token.tag) return '</' + token.tag + '>';
      return '';
    }
  }
}

function buildInlineCloseMarkup(stack) {
  return stack.slice().reverse().map(t => '</' + t.tag + '>').join('');
}

function buildBlockCloseMarkup(stack) {
  return stack.slice().reverse().map(t => '</' + t.tag + '>').join('');
}

function prependOpenTags(tokens, blockStack, inlineStack) {
  for (const openTag of blockStack) tokens.unshift(openTag);
  for (const openTag of inlineStack) tokens.unshift(openTag);
}

const pages = [];
let currentChars = 0;
let currentPageTokens = [];
const openInlineStack = [];
const openBlockStack = [];

function flushPage(pages, tokens, inlineClose, blockClose, pageNum) {
  let bodyHtml = '';
  for (const t of tokens) bodyHtml += tokenToHtml(t);
  const html = bodyHtml + inlineClose + blockClose;
  const pageIdx = pages.length + 1;
  if (pageIdx >= 3 && pageIdx <= 6) {
    console.log(`\nFLUSH page ${pageIdx}:`);
    console.log('  bodyHtml ends with:', JSON.stringify(bodyHtml.slice(-60)));
    console.log('  inlineClose:', JSON.stringify(inlineClose));
    console.log('  blockClose:', JSON.stringify(blockClose));
    console.log('  openInlineStack (after save):', openInlineStack.map(t => t.type + '(' + t.tag + ')'));
    console.log('  newPageTokens starts with:', tokens.slice(0, 3).map(t => t.type + '(' + t.tag + ')'));
  }
  pages.push(html);
}

for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];

  if (token.type === 'inline') {
    const children = token.children ?? [];
    let childIdx = 0;

    while (childIdx < children.length) {
      const child = children[childIdx];
      const childLen = childTokenChars(child);
      const remaining = CHARS_PER_PAGE - currentChars;

      if (remaining <= 0) {
        const savedInlineStack = [...openInlineStack];
        const inlineClose = buildInlineCloseMarkup(savedInlineStack);
        const blockClose = buildBlockCloseMarkup(openBlockStack);
        flushPage(pages, currentPageTokens, inlineClose, blockClose, pages.length + 1);
        currentPageTokens = [];
        currentChars = 0;
        openInlineStack.length = 0;
        prependOpenTags(currentPageTokens, openBlockStack, savedInlineStack);
        for (const t of savedInlineStack) openInlineStack.push(t);
        continue;
      }

      if (child.type === 'text' || child.type === 'softbreak' || child.type === 'hardbreak') {
        while (childLen > CHARS_PER_PAGE - currentChars && currentChars > 0) {
          const savedInlineStack = [...openInlineStack];
          const inlineClose = buildInlineCloseMarkup(savedInlineStack);
          const blockClose = buildBlockCloseMarkup(openBlockStack);
          flushPage(pages, currentPageTokens, inlineClose, blockClose, pages.length + 1);
          currentPageTokens = [];
          currentChars = 0;
          openInlineStack.length = 0;
          prependOpenTags(currentPageTokens, openBlockStack, savedInlineStack);
          for (const t of savedInlineStack) openInlineStack.push(t);
        }
        if (childLen > CHARS_PER_PAGE - currentChars && currentChars === 0) {
          let textRemaining = child.content ?? '';
          while (textRemaining.length > 0) {
            const chunkSize = Math.min(textRemaining.length, CHARS_PER_PAGE);
            const chunk = { ...child, content: textRemaining.slice(0, chunkSize) };
            textRemaining = textRemaining.slice(chunkSize);
            currentPageTokens.push(chunk);
            currentChars += chunkSize;
            if (currentChars >= CHARS_PER_PAGE && textRemaining.length > 0) {
              const savedInlineStack = [...openInlineStack];
              const inlineClose = buildInlineCloseMarkup(savedInlineStack);
              const blockClose = buildBlockCloseMarkup(openBlockStack);
              flushPage(pages, currentPageTokens, inlineClose, blockClose, pages.length + 1);
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

      if (child.type.endsWith('_open') && COMPOUND_TAGS.has(child.tag)) {
        openInlineStack.push(child);
        currentPageTokens.push(child);
        currentChars += childLen;
        childIdx++;
        continue;
      }

      if (child.type.endsWith('_close') && COMPOUND_TAGS.has(child.tag)) {
        currentPageTokens.push(child);
        currentChars += childLen;
        for (let j = openInlineStack.length - 1; j >= 0; j--) {
          if (openInlineStack[j].tag === child.tag) {
            openInlineStack.splice(j, 1);
            break;
          }
        }
        childIdx++;
        continue;
      }

      if (child.type === 'code_inline') {
        currentPageTokens.push(child);
        currentChars += childLen;
        childIdx++;
        continue;
      }

      childIdx++;
    }
    continue;
  }

  if (isBlockOpen(token)) {
    currentPageTokens.push(token);
    openBlockStack.push(token);
    continue;
  }

  if (token.type === 'paragraph_close' || token.type === 'heading_close' || token.type === 'blockquote_close') {
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

  if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open' ||
      token.type === 'bullet_list_close' || token.type === 'ordered_list_close' ||
      token.type === 'list_item_open' || token.type === 'list_item_close') {
    currentPageTokens.push(token);
    continue;
  }

  if (token.type === 'image') {
    currentPageTokens.push({ ...token, content: '', type: 'img_rendered' });
    continue;
  }

  if (token.type === 'hr') {
    if (currentChars + 4 > CHARS_PER_PAGE && currentChars > 0) {
      const savedInlineStack = [...openInlineStack];
      const inlineClose = buildInlineCloseMarkup(savedInlineStack);
      const blockClose = buildBlockCloseMarkup(openBlockStack);
      flushPage(pages, currentPageTokens, inlineClose, blockClose, pages.length + 1);
      currentPageTokens = [];
      currentChars = 0;
      openInlineStack.length = 0;
      openBlockStack.length = 0;
      prependOpenTags(currentPageTokens, openBlockStack, savedInlineStack);
    }
    currentPageTokens.push({ ...token, content: '<hr>', type: 'hr_rendered' });
    currentChars += 4;
    continue;
  }

  if (token.type === 'fence') {
    continue;
  }
}

if (currentPageTokens.length > 0) {
  const inlineClose = buildInlineCloseMarkup(openInlineStack);
  const blockClose = buildBlockCloseMarkup(openBlockStack);
  flushPage(pages, currentPageTokens, inlineClose, blockClose, pages.length + 1);
}

console.log('\nTotal pages:', pages.length);
