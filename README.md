# Skills Repository

A collection of specialized AI skills for various software development tasks.

## Install All Skills

```bash
npx skills add Lan-zk/skills
```

> Use `git pull` in the skills store directory to update all skills at once.

## Skills

### md2card

A **Markdown to Paginated Card** skill that renders Markdown files into paginated PNG images with dual themes (Apple / Claude), suitable for long-form content sharing.

**Features:**
- Converts Markdown into paginated PNG cards
- Dual theme support (Apple / Claude)
- Handles code blocks, syntax highlighting, and rich text formatting
- CLI-driven batch rendering

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill md2card
```

**Documentation:** See [`md2card/SKILL.md`](md2card/SKILL.md) for detailed specifications.

---

### author

A **Dynamic Persona Baseline** skill that maintains an `AUTHOR.md` persona profile through AI observation capture and conversational distillation, continuously approaching a more accurate persona description.

**Features:**
- Captures raw observations about the user during conversation
- Distills observations into the `AUTHOR.md` persona baseline
- Serves as the writing gravity center for the `writing` skill
- Updates incrementally rather than rewriting from scratch

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill author
```

**Documentation:** See [`author/SKILL.md`](author/SKILL.md) for detailed specifications.

---

### visual-cast

A **Runnable OpenClaw Visual Rendering Skill** that converts upstream text, Markdown, or normalized items into shareable PNG cards or merged long images.

**Features:**
- Normalizes upstream content into card-safe structured items
- Renders PNG images with `Satori` plus `@resvg/resvg-js`
- Supports `single_cards` and `merged_long_image`
- Supports `glassmorphism`, `linear_vercel`, and `bento_ui`
- Accepts file input, stdin input, or bundled mock payloads
- Returns either PNG file paths or base64 payloads for downstream OpenClaw nodes

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill visual-cast
```

**Quick Start:**
```bash
cd visual-cast
npm install
node scripts/render_visual_cast.mjs --input examples/news-input.json --output-dir ./tmp/news
node scripts/render_visual_cast.mjs --mock github --output-dir ./tmp/github
```

**Documentation:** See [`visual-cast/SKILL.md`](visual-cast/SKILL.md) for the skill definition and [`visual-cast/references/openclaw-integration.md`](visual-cast/references/openclaw-integration.md) for runtime contract details.

---

### github-trending-to-card

A **GitHub Trending Visual Card Generator** that fetches the latest GitHub Trending data and generates high-resolution 1080×1440 PNG cards for each trending repository, suitable for social media distribution.

**Features:**
- Fetches live GitHub Trending data (daily / weekly / monthly)
- Renders visually appealing PNG cards with language stats, star trends, and repo metadata
- Supports multi-language trending (Go, Rust, Python, TypeScript, etc.)
- Integrates translation via subagent for non-English card text
- Designed for content operations and social media automation

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill github-trending-to-card
```

**Documentation:** See [`github-trending-to-card/SKILL.md`](github-trending-to-card/SKILL.md) for detailed specifications.

---

### writing

A **Multi-Mode Writing** skill that supports long-form articles, newsletters, personal essays, narrative nonfiction, and short-form commentary. Auto-detects genre and selects the appropriate style — or accepts manual mode override.

**Features:**
- **Auto-detection** — recognizes genre from input and selects the optimal writing style
- **Four Modes** — why-deep, observe, craft, snippet (each with distinct pacing, structure, and voice)
- **Author Centric** — uses `AUTHOR.md` as the writing gravity center
- **Quality Gates** — anti-redundancy, anti-fake-thinking, paragraph-level cognitive movement checks
- **Style Inheritance** — inherits from `article-writing`, `writing-clearly-and-concisely`, `khazix-writer`

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill writing
```

**Documentation:** See [`writing/SKILL.md`](writing/SKILL.md) for detailed specifications.

---

### writing-to-card

A **Markdown to Social Card Converter** that transforms long-form Markdown articles into multiple 1080×1440 PNG images optimized for Xiaohongshu (Little Red Book) publishing.

**Features:**
- Converts Markdown articles into card-style 1080×1440 PNG images
- Optimized for Xiaohongshu platform aesthetic
- Handles code snippets, syntax highlighting, and rich text formatting
- Supports batch rendering of multiple articles
- Designed for content creators and technical bloggers

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill writing-to-card
```

**Documentation:** See [`writing-to-card/SKILL.md`](writing-to-card/SKILL.md) for detailed specifications.

---

### 纸短

A **Qiaopi (侨批) Classical Chinese Letter Converter** that transforms modern vernacular Chinese into the style of overseas Chinese family letters (侨批/番批), preserving authentic salutations, vocabulary, sentence patterns, and emotional restraint.

**Features:**
- Converts modern Chinese into half-classical, half-vernacular 侨批 letter style
- Authentic salutation and sign-off system matched to relationships (spouse, parent, child, sibling, friend)
- Core 侨批 vocabulary (番银, 批局, 唐山, 南洋, etc.)
- Emotional restraint through concrete details instead of direct sentiment
- Supports multiple regional styles (潮汕, 闽南, 客家)
- Includes reference examples covering diverse relationships and scenarios

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill 纸短
```

**Documentation:** See [`纸短/SKILL.md`](纸短/SKILL.md) for detailed specifications.

---

## Contributing

This repository contains specialized skills for AI-assisted development. Each skill is contained in its own directory with a `SKILL.md` file describing its purpose and constraints.

## License

To be determined.
