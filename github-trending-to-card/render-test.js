const fs = require('fs');
const handlebars = require('handlebars');
const { chromium } = require('playwright');

const templateHtml = fs.readFileSync('templates/card.html', 'utf8');
const template = handlebars.compile(templateHtml);

const items = [
  { owner: 'luongnv89', name: 'claude-howto', description: 'A visual, example-driven guide to Claude Code — from basic concepts to advanced agents, with copy-paste templates that bring immediate value.', language: 'Python', hex: '#3572A5', stars: '15,975', new_stars: '2,847', forks: '823', contributors: '1', license: 'MIT License', timestamp: '2026-04-02 09:00' },
  { owner: 'microsoft', name: 'VibeVoice', description: 'Open-Source Frontier Voice AI', language: 'Python', hex: '#3572A5', stars: '34,632', new_stars: '8,241', forks: '1,847', contributors: '12', license: 'MIT License', timestamp: '2026-04-02 09:00' },
  { owner: 'mvanhorn', name: 'last30days-skill', description: 'AI agent skill that researches any topic across Reddit, X, YouTube, HN, Polymarket, and the web — then synthesizes a grounded summary', language: 'Python', hex: '#3572A5', stars: '17,385', new_stars: '5,102', forks: '912', contributors: '1', license: 'Apache-2.0', timestamp: '2026-04-02 09:00' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  for (const item of items) {
    const renderedHtml = template(item);
    await page.setContent(renderedHtml, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const element = await page.$('.card-container');
    const screenshot = await element.screenshot({ type: 'png' });
    const safe = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = 'test-output/card-' + safe + '.png';
    fs.writeFileSync(filename, screenshot);
    console.log('Saved [' + item.owner + '/' + item.name + '] ' + screenshot.length + ' bytes -> ' + filename);
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
