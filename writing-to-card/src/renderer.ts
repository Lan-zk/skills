import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { VIEWPORT } from './constants';

// ─── Browser management ───────────────────────────────────────────────────────

let browserInstance: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance) return browserInstance;

  // Store the launch promise so concurrent calls reuse the same promise
  if (!launchPromise) {
    launchPromise = chromium.launch({
      headless: true,
      channel: process.env.PLAYWRIGHT_CHANNEL === 'skip' ? undefined : 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  browserInstance = await launchPromise;
  launchPromise = null;
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ─── Template loading ─────────────────────────────────────────────────────────

function loadTemplate(name: string): HandlebarsTemplateDelegate {
  const templatePath = path.resolve(__dirname, '../templates', `${name}.hbs`);
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  return handlebars.compile(templateHtml);
}

// ─── Screenshot capture ──────────────────────────────────────────────────────

async function takeScreenshot(html: string): Promise<string> {
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
    await page.waitForTimeout(100); // Wait for fonts to load

    const buffer = await page.screenshot({ type: 'png' });
    await page.close();
    return buffer.toString('base64');
  } finally {
    await context.close();
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CoverData {
  title: string;
  subtitle?: string;
  date: string;
  author: string;
}

/**
 * Render the cover page and return Base64 PNG string.
 */
export async function renderCover(data: CoverData): Promise<string> {
  const template = loadTemplate('cover');
  const html = template(data);
  return takeScreenshot(html);
}

export interface ContentData {
  /** Pre-rendered HTML content from markdown-it */
  content: string;
  date: string;
  author: string;
}

/**
 * Render a content page and return Base64 PNG string.
 */
export async function renderContent(data: ContentData): Promise<string> {
  const template = loadTemplate('content');
  const html = template(data);
  return takeScreenshot(html);
}
