const fs = require('fs');
const { chromium } = require('playwright');

/**
 * Preview renderer for templates/jojo-card.html
 * Fills {{placeholder}} values with mock data and renders a PNG.
 */
const mockItem = {
  owner: 'langchain-ai',
  name: 'LangChain',
  description: 'Building context-aware reasoning applications with LLMs. Provides a standard interface for chains, tool integration, and memory management.',
  language: 'Python',
  hex: '#3572A5',
  stars: '68.2k',
  new_stars: '+328',
  forks: '9.1k+',
  contributors: '2,100+',
  license: 'MIT',
  timestamp: '2026-04-03',
  // Radar grades (A-E) computed from metrics
  power: 'A',
  speed: 'A',
  range: 'A',
  stamina: 'B',
  precision: 'B',
  potential: 'A',
};

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  // Read template and substitute all {{placeholder}} values
  const templatePath = require('path').resolve(__dirname, 'templates/jojo-card.html');
  let html = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, val] of Object.entries(mockItem)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
  }

  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const card = await page.$('.card');
  if (!card) { console.error('ERROR: .card element not found'); process.exit(1); }

  const screenshot = await card.screenshot({ type: 'png' });
  const outPath = require('path').resolve(__dirname, 'test-output/jojo-preview.png');
  fs.writeFileSync(outPath, screenshot);

  if (errors.length > 0) {
    console.error('Console errors:', errors);
    process.exit(1);
  }

  console.log(`OK: ${outPath} (${screenshot.length} bytes)`);
  await browser.close();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
