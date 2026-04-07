import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { TrendingItem, TemplateName } from './types';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      // Prefer system Chrome if available; set PLAYWRIGHT_CHANNEL=skip to force bundled
      channel: process.env.PLAYWRIGHT_CHANNEL === 'skip' ? undefined : 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export function parseNum(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[,+]/g, '');
  if (cleaned.endsWith('k')) return parseFloat(cleaned) * 1000;
  if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1000000;
  return parseFloat(cleaned) || 0;
}

function grade(v: number, t: [number, number, number, number]): string {
  return v >= t[0] ? 'A' : v >= t[1] ? 'B' : v >= t[2] ? 'C' : v >= t[3] ? 'D' : 'E';
}

export function computeRadarStats(item: TrendingItem) {
  return {
    power:     grade(parseNum(item.stars),        [50000, 10000, 1000, 100]),
    speed:     grade(parseNum(item.new_stars),   [500,   100,   50,   10]),
    range:     grade(parseNum(item.forks),        [10000, 1000,  100,  10]),
    stamina:   grade(parseNum(item.contributors), [1000,  200,   50,   10]),
    precision: grade(parseNum(item.contributors), [500,   100,   30,   5]),
    potential: grade(parseNum(item.forks),        [10000, 1000,  100,  10]),
  };
}

export async function renderCards(items: TrendingItem[], templateName: TemplateName = 'card'): Promise<string[]> {
  const templatePath = path.resolve(__dirname, `../templates/${templateName}.html`);
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebars.compile(templateHtml);

  const browser = await getBrowser();
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 1080, height: 1440 },
  });

  const base64Images: string[] = [];

  try {
    for (const item of items) {
      const data = templateName === 'jojo-card'
        ? { ...item, ...computeRadarStats(item) }
        : item;
      const html = template(data);
      const page = await context.newPage();

      await page.setContent(html, { waitUntil: 'networkidle' });

      // Wait for fonts if any, or just a tiny bit for render
      await page.waitForTimeout(100);

      const cardElement = await page.$('.card-container');
      if (cardElement) {
        const buffer = await cardElement.screenshot({ type: 'png' });
        base64Images.push(buffer.toString('base64'));
      } else {
        throw new Error('Card container not found in rendered HTML');
      }

      await page.close();
    }
  } finally {
    await context.close();
    // We intentionally keep the browser instance alive for subsequent skill invocations.
    // In a real serverless env, we might need to close it if the process dies.
  }

  return base64Images;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
