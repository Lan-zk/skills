const fs = require('fs');
const handlebars = require('handlebars');
const { chromium } = require('playwright');

const templateHtml = fs.readFileSync('templates/card-preview.html', 'utf8');
const template = handlebars.compile(templateHtml);

const item = {
  owner: 'microsoft',
  name: 'VibeVoice',
  description: 'Open-Source Frontier Voice AI — a cutting-edge voice recognition and synthesis platform built for production scale.',
  language: 'Python',
  hex: '#3572A5',
  stars: '34,632',
  new_stars: '8,241',
  forks: '1,847',
  contributors: '12',
  license: 'MIT License',
  timestamp: '2026-04-02 08:00',
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  const renderedHtml = template(item);
  await page.setContent(renderedHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const element = await page.$('.card-container');
  const screenshot = await element.screenshot({ type: 'png' });
  fs.writeFileSync('test-output/preview-1440.png', screenshot);
  console.log('Saved test-output/preview-1440.png', screenshot.length, 'bytes');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
