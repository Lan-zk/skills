# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a **Skills repository** — a collection of Claude Code skills for AI-assisted development. Each skill is a self-contained directory with a `SKILL.md` file that defines the skill's purpose, constraints, workflow, and references.

## Current Skills

| Skill | Purpose |
|-------|---------|
| `github-trending-to-card/` | Scrapes GitHub Trending, renders 1080×1440 PNG cards |
| `md2card/` | Converts Markdown files to paginated PNG cards with dual themes (Apple/Claude) |
| `visual-cast/` | Converts upstream text/Markdown into PNG cards or merged long images via Satori + resvg |
| `writing-to-card/` | Transforms Markdown articles into 1080×1440 PNG cards for Xiaohongshu |
| `writing/` | Multi-mode long-form writing (why-deep / observe) from ideas and collected materials |
| `author/` | Maintains a dynamic persona baseline `AUTHOR.md` via AI observation capture |
| `纸短/` | Converts modern Chinese into classical overseas Chinese letter (侨批) style |

> Note: `github-trending-to-card/` has its own `CLAUDE.md` with detailed architecture docs.

## Skill Format (Critical)

Every skill directory MUST have a `SKILL.md` file with this exact structure:

```markdown
---
name: skill-name
description: Brief description (under 200 characters, no blank lines before this line)
---

# Skill Title
[content]
```

**Rules:**
- File MUST start with `---` on line 1 — no blank lines before it
- `name` must match the directory name (lowercase, hyphenated)
- `description` must be concise (under 200 chars)
- Use LF line endings (not CRLF)
- Optional fields: `categories`, `tags`, `version`, `author`

See `skills-design/Skill-Authoring-Spec.md` for the full specification.

## Development

Each skill is self-contained; commands run from the skill's own directory.

**github-trending-to-card** (Node.js/TypeScript):
```bash
cd github-trending-to-card
npm install
npm run build   # TypeScript compilation
npm run test    # Jest test suite (30s timeout per integration test)
npm run lint    # ESLint
```

**visual-cast** (Node.js/mjs scripts):
```bash
cd visual-cast
npm install
node scripts/render_visual_cast.mjs --input examples/news-input.json --output-dir ./tmp/news
node scripts/render_visual_cast.mjs --mock github --output-dir ./tmp/github
```

**writing-to-card** (Node.js):
```bash
cd writing-to-card
npm install
node src/index.js --help
```

**md2card** (Node.js/TypeScript):
```bash
cd md2card
npm install
npm run build   # TypeScript compilation
npm test        # Jest test suite
# Run from CLI
node scripts/index.js <input.md> <outputDir> --theme apple
node scripts/index.js <input.md> <outputDir> --theme claude
```

**Validate skills locally**:
```bash
npx skills add . --skill <skill-name> --force
npx skills list .
```

## Design Docs

- **`skills-design/`** — Skills design specs and authoring guidelines (research notes, design patterns, architecture, and the Skill Authoring Spec)

## Architecture Notes

- Skills follow **progressive disclosure**: `SKILL.md` is the workflow shell; deep knowledge lives in `references/`, `scripts/`, `templates/`, and `data/` subdirectories.
- Top-level skill count should stay small (3-7 max). When creating new skills, verify the boundary criteria: different trigger language, workflow, output, and evaluation.
- Five design patterns govern skill internals: Tool Wrapper, Generator, Reviewer, Inversion, and Pipeline. Complex skills are multi-pattern combinations.
