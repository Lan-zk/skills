# GitHub Trending to Card — Skill Design

## 1. Overview

**Purpose**: Fetch GitHub trending repository data and render each entry as a high-quality PNG card image, delivered as an API/Skill for OpenClaw + Telegram integration.

**Input**: Optional filters (time range, language, spoken language).

**Output**: Array of 10 Base64-encoded PNG images, one per trending repository.

**Delivery context**: Called by OpenClaw; translated/enriched by the invoking Agent; pushed to user via Telegram.

---

## 2. Pipeline

The skill executes a single, linear three-step pipeline:

```
Scrape → Fallback Enrich → Render → Return Base64[]
```

### Step 1: Data Scraping

- Target: `https://github.com/trending` with optional path (`/{language}`) and query params (`since`, `spoken_language_code`).
- Library: `axios` + `cheerio`.
- Retry: 3 attempts with exponential backoff via `axios-retry`.
- Extracted fields per repository:
  - `name` — `owner/repo` format
  - `description` — paragraph text from the article
  - `language` — programming language name
  - `hex` — language color hex code
  - `stars` — total star count
  - `new_stars` — stars gained in the selected time window
- Selector: `article.Box-row` (top 10 only).

### Step 2: Description Fallback

- Triggered when a repository has no description on the trending page.
- Action: fetch `https://github.com/{owner}/{repo}`, extract `<p.f4>` text or `<meta name="description">` content.
- If still empty: use the repository name as a last resort.
- **No LLM translation in-skill** — raw description text is returned as-is. The invoking Agent handles translation.

### Step 3: Card Rendering

- Template engine: `handlebars` — injects each `TrendingItem` into a single HTML template.
- Rendering engine: `playwright` with headless Chromium.
- Screenshot: captures `.card-container` element at `deviceScaleFactor: 2`, `viewport: 850x400`.
- Output: PNG buffer converted to Base64 string.
- Browser lifecycle: singleton browser instance kept warm across invocations to avoid startup overhead.

---

## 3. Data Model

```typescript
interface SkillInput {
  time_range?: 'daily' | 'weekly' | 'monthly';  // default: 'daily'
  language?: string;                             // e.g. 'python', 'javascript'
  spoken_language_code?: string;                 // e.g. 'zh', 'en'
}

interface TrendingItem {
  name: string;        // "owner/repo"
  description: string; // raw text, no translation
  language: string;    // e.g. "Python"
  hex: string;         // e.g. "#3572A5"
  stars: string;       // e.g. "12,345"
  new_stars: string;   // e.g. "150"
}

interface SkillOutput {
  trending_cards: string[]; // 10 Base64-encoded PNG images
}
```

---

## 4. Error Handling

| Scenario | Behavior |
|----------|----------|
| GitHub trending page unreachable | Throw with original error, agent retries or reports to user |
| Zero items scraped | Throw: "No trending items found" |
| Card element not found during render | Throw: "Card container not found in rendered HTML" |
| Playwright launch failure | Throw with Chromium error details |
| Description still empty after fallback | Set to repository name as last resort |

All errors are thrown, not swallowed. The invoking OpenClaw/Agent handles retry or user notification.

---

## 5. Template

The HTML template lives at `templates/card.html`. Initial version is the existing dark-theme template. Template is outside the skill logic pipeline — no code changes needed to swap visual styles.

**Slots** (Handlebars variables):

| Variable | Source field |
|----------|-------------|
| `{{name}}` | `TrendingItem.name` |
| `{{description}}` | `TrendingItem.description` |
| `{{hex}}` | `TrendingItem.hex` |
| `{{language}}` | `TrendingItem.language` |
| `{{stars}}` | `TrendingItem.stars` |
| `{{new_stars}}` | `TrendingItem.new_stars` |

---

## 6. File Structure

```
github-trending-to-card/
├── SKILL.md              # Skill metadata and usage instructions
├── src/
│   ├── index.ts           # Entry point, pipeline orchestration
│   ├── scraper.ts        # Step 1: HTTP fetch + HTML parse
│   ├── renderer.ts       # Step 3: Playwright screenshot
│   └── types.ts          # Shared TypeScript interfaces
├── templates/
│   └── card.html          # Handlebars HTML template
├── references/           # (reserved for future docs)
├── scripts/               # (reserved for build/check scripts)
├── evals/                 # (reserved for evaluation cases)
└── package.json
```

---

## 7. Out of Scope

- LLM translation or summarization — handled by the invoking Agent
- File I/O — skill returns Base64 only; caller writes files
- Card template visual design — handled separately by UI/UX skill
- Caching — caller decides caching strategy
- Multi-page scraping beyond top 10

---

## 8. Testing

- Unit tests for `scraper.ts`: mock HTTP responses, verify field extraction
- Unit tests for `renderer.ts`: mock Playwright page, verify screenshot call
- Integration test for `index.ts`: end-to-end with real HTTP (or recorded fixtures)

---

## 9. Commands

```bash
npm install && npx playwright install chromium   # Setup
npm start                                         # Run locally (daily trending, debug output)
npm run test                                      # Jest unit tests
npm run build                                     # TypeScript compilation
npm run precommit                                 # lint + type-check + test + build
```
