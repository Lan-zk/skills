import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { TrendingItem } from './types';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function renderCards(items: TrendingItem[]): Promise<string[]> {
  const templatePath = path.resolve(__dirname, '../templates/card.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebars.compile(templateHtml);

  const browser = await getBrowser();
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 1080, height: 1350 },
  });

  const base64Images: string[] = [];

  try {
    for (const item of items) {
      const html = template(item);
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
