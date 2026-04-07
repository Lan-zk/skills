# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A TypeScript skill that scrapes GitHub Trending, translates project descriptions to Chinese via LLM, and renders 1080×1080 PNG cards using Playwright + Handlebars templates.

## Commands

```bash
npm run precommit   # lint + type-check + test + build (CI gate)
npm start           # run locally with dotenv (scrapes daily, outputs to output/YYYY-MM-DD/)
npm run test        # Jest (80% branch/stmt/func/line coverage required)
npm run lint        # ESLint
npm run type-check  # tsc --noEmit
npm run build       # tsc → dist/
```

## Architecture

```
scrapeTrending()  →  translateDescriptions()  →  renderCards()
     ↑                        ↑                       ↑
 Cheerio (HTTP)         LLM API (OpenAI SDK)   Playwright screenshot
```

### Source files

| File | Role |
|------|------|
| `src/scraper.ts` | Fetches GitHub trending page + individual repo pages for metadata (contributors, license). Fetches owner profile from GitHub REST API (`/users/{owner}`) for avatar, repos count, followers. Returns `TrendingItem[]` |
| `src/translator.ts` | Batches descriptions → single LLM call → parses numbered translations back into items |
| `src/summarizer.ts` | Fetches README per project → LLM generates concise Chinese AI intro (problem + solution) |
| `src/markdownWriter.ts` | Generates one `.md` file per trending item in `outputDir` with name, URL, description, AI intro, and metadata table |
| `src/renderer.ts` | Compiles Handlebars template → Playwright renders HTML → screenshots `.card-container` div → returns base64 PNG |
| `src/types.ts` | `TrendingItem` (11 fields) and `SkillInput` interfaces |
| `src/llmClient.ts` | Creates OpenAI-compatible client. Reads `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` from env |

### Template system

Templates use **Mustache** (`{{placeholder}}`) syntax. The renderer reads `templates/card.html` and compiles it with `handlebars.compile()`. All CSS values should use `var()` tokens — never hard-code colors or sizes.

Card dimensions: **1080×1440 px** (3:4 ratio, Xiaohongshu-optimized), viewport configured in `renderer.ts` with `deviceScaleFactor: 2` (renders at 2160×2880 retina resolution).

### Env variables

```env
LLM_API_KEY=sk-...           # Required for translation
LLM_BASE_URL=https://api.siliconflow.cn/v1   # Default
LLM_MODEL=Qwen/Qwen3-235B-A22B-Instruct-2507  # Default
```

Without `LLM_API_KEY`, the skill runs without translation (descriptions stay in English).

## Design

Card follows an **editorial print aesthetic** — warm paper background (`#faf9f7`), ink (`#0f172a`), red accent (`#e8453c`), steel blue (`#3d5a80`). See `.impeccable.md` for full design context.

The CSS token system lives in `:root` in the HTML template. Key tokens:

- `--text-masthead` (64px), `--text-repo-name` (44px), `--text-body` (22px), `--text-label` (14px), `--text-meta` (12px)
- `--color-ink`, `--color-accent`, `--color-paper`, `--color-steel`
- `--sp-N` (8px grid), `--shadow-card`, `--radius-sm/md`

## Testing

Tests are in `evals/`. The scraper and renderer are tested with mocked HTTP and mocked Playwright respectively. When adding fields to `TrendingItem`, update all fixtures in both `renderer.test.ts` and `translator.test.ts`.

## Output

`output/YYYY-MM-DD/card-NN.png` — one PNG per trending repo, max 10 cards per run. Output is 1080×1440px (3:4 Xiaohongshu format).

`output/YYYY-MM-DD/{repo-name}.md` — one Markdown file per trending repo, containing project name, URL, translated description, AI intro, and metadata table.
