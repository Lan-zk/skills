# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a **Skills repository** — a collection of Claude Code skills for AI-assisted development. Each skill is a self-contained directory with a `SKILL.md` file that defines the skill's purpose, constraints, workflow, and references.

## Current Skills

| Skill | Purpose |
|-------|---------|
| `github-trending-to-card/` | Scrapes GitHub Trending, translates descriptions to Chinese via LLM, renders 1080×1080 PNG cards with editorial print aesthetic |
| `java-arch-designer/` | Complex business logic architect — selects GoF design patterns and generates Service layer code skeletons |
| `java-mermaid-analyzer/` | Analyzes Java execution paths and generates Mermaid flowcharts |
| `first-principles-thinking/` | Rigorous requirements analysis with Socratic questioning and 3-phase validation |
| `skill-creator-with-validation/` | Creates and validates Skills CLI-compatible skills |

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

See `skill-creator-with-validation/references/skills-cli-spec.md` for the full specification.

## Commands

```bash
# Test if skills are recognized by Skills CLI
npx skills add .

# Test a specific skill
npx skills add . --skill skill-name --force

# List all skills in repo
npx skills list .
```

## In-Progress Projects

- **`skills-design/`** — Research documents on skills design patterns and architecture (Chinese).

## Architecture Notes

- Skills follow **progressive disclosure**: `SKILL.md` is the workflow shell; deep knowledge lives in `references/`, `scripts/`, `templates/`, and `data/` subdirectories.
- Top-level skill count should stay small (3-7 max). When creating new skills, verify the boundary criteria: different trigger language, workflow, output, and evaluation.
- Five design patterns govern skill internals: Tool Wrapper, Generator, Reviewer, Inversion, and Pipeline. Complex skills are multi-pattern combinations.
