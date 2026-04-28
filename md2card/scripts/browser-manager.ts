import { chromium, Browser, BrowserContext, Page } from 'playwright';

let browserInstance: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

export interface BrowserManager {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance) return browserInstance;

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

export async function createBrowserManager(
  viewportWidth: number,
  viewportHeight: number,
  deviceScaleFactor: number = 2
): Promise<BrowserManager> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    deviceScaleFactor,
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
  });

  const page = await context.newPage();
  await page.setViewportSize({ width: viewportWidth, height: viewportHeight });

  return { browser, context, page };
}

export async function closeBrowserManager(manager: BrowserManager): Promise<void> {
  await manager.page.close();
  await manager.context.close();
}
