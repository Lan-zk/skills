const fs = require('fs');
const handlebars = require('handlebars');

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

fs.writeFileSync('test-output/preview-1440.html', template(item));
console.log('Saved test-output/preview-1440.html');
