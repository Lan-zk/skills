# GEMINI.md - Skills Repository

## Project Overview
This repository is a managed collection of **Agent Skills**—specialized modules that extend AI agent capabilities for software engineering, architecture, and visualization. It follows the [Skills CLI](https://skills.sh) standard where each skill is contained in its own directory with a `SKILL.md` definition.

### Key Components
- **Prompt-Based Skills**: Most skills (e.g., `java-arch-designer`, `java-mermaid-analyzer`) are high-context prompt engineering modules that provide specialized logic for architectural design or code analysis.
- **Runnable Skills**: `visual-cast` is a full Node.js application that can be executed to render content into visual PNG cards using Satori and Resvg.
- **Meta-Skills**: `skill-creator-with-validation` provides the standards and validation rules for all other skills in the repo.

## Directory Structure
- `[skill-name]/`: Individual skill directory.
  - `SKILL.md`: The primary definition and instructions for the skill.
  - `references/`: Supporting documentation, examples, and specifications.
- `visual-cast/`: A runnable skill with a Node.js implementation for image rendering.
- `skill-creator-with-validation/`: Contains the "Source of Truth" for skill development standards.

## Development Conventions

### SKILL.md Standards
All `SKILL.md` files **MUST** follow these strict formatting rules (as defined in `skill-creator-with-validation`):
1. **YAML Front Matter**: Must start on **Line 1** with `---`. **No blank lines allowed** before the header.
2. **Concise Descriptions**: The `description` field in the YAML header should be under **200 characters**.
3. **Naming Consistency**: The directory name must match the `name` field in the YAML header.
4. **Header Content**:
   ```yaml
   ---
   name: skill-name
   description: Concise summary of capabilities
   categories: [cat1, cat2]
   tags: [tag1, tag2]
   ---
   ```

### Runnable Skills (`visual-cast`)
- **Technology Stack**: Node.js (ESM), Satori (HTML/CSS to SVG), @resvg/resvg-js (SVG to PNG), Python (JSON validation).
- **Themes**: Supports `glassmorphism`, `linear_vercel`, and `bento_ui`.
- **Modes**: Supports `single_cards` and `merged_long_image`.

## Key Commands

### General Skill Management
- **Test Local Skills**: `npx skills add .` (Add all skills in the repo to your local agent).
- **Test Specific Skill**: `npx skills add . --skill <skill-name>`.
- **List Skills**: `npx skills list .`.

### Visual Cast (`visual-cast/`)
- **Install Dependencies**: `npm install` (within `visual-cast/`).
- **Render Mock Data**:
  - `npm run render:mock:news`
  - `npm run render:mock:github`
- **Manual Execution**: `node scripts/render_visual_cast.mjs --input <path> --output-dir <path>`.
- **JSON Validation**: `python3 scripts/validate_visual_cast_json.py response.json`.

## Guidelines for Adding/Modifying Skills
- **Consult the Meta-Skill**: Read `skill-creator-with-validation/SKILL.md` before creating or fixing skills.
- **Validation**: Always use `npx skills add .` to verify that the agent can properly parse your `SKILL.md`.
- **References**: Place large examples, schemas, or complex instructions in the `references/` subdirectory of the skill to keep the main `SKILL.md` focused and efficient.
