const fs = require('fs');
const { chromium } = require('playwright');

const mockups = [
  'A1-masthead-as-project-name.html',
  'A2-hero-project-name.html',
  'A3-minimal-masthead-stats-inline.html',
  'B1-author-section.html',
  'RECOMMENDED-A1+B1-combo.html',
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const filename of mockups) {
    const htmlPath = `test-output/mockups/${filename}`;
    const pngPath = `test-output/mockups/${filename.replace('.html', '.png')}`;

    const context = await browser.newContext({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 2 });
    const page = await context.newPage();

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const element = await page.$('.card-container');
    const screenshot = await element.screenshot({ type: 'png' });
    fs.writeFileSync(pngPath, screenshot);
    console.log(`[OK] ${filename} -> ${screenshot.length} bytes`);

    await context.close();
  }

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
