# Skills Repository

A collection of specialized AI skills for various software development tasks.

## Install All Skills

```bash
npx skills add Lan-zk/skills
```

> Use `git pull` in the skills store directory to update all skills at once.

## Skills

### java-arch-designer

A **Complex Business Logic Architect / Design Pattern Specialist** that diagnoses business scenarios, selects appropriate GoF design patterns, and generates scalable code skeletons for complex business logic within the Service layer.

**Features:**
- Analyzes business process descriptions or Mermaid flowcharts
- Identifies the most suitable GoF design patterns (Strategy, State, Chain of Responsibility, Observer, Factory, etc.)
- Generates highly scalable code skeletons focused on Service layer complexity
- Provides rigorous technical selection rationale for pattern choices
- Strictly prohibits three-tier architecture boilerplate code

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill java-arch-designer
```

**Documentation:** See [`skills/java-arch-designer/SKILL.md`](skills/java-arch-designer/SKILL.md) for detailed specifications.

---

### java-mermaid-analyzer

A **Java Code Execution Path Analysis and Mermaid Diagram Generation** skill that deeply traces Java code execution logic and generates precise Mermaid flowcharts to visualize method call chains and business flows.

**Features:**
- Analyzes Java code and specified entry methods to trace execution paths
- Identifies conditional branches (if/else/switch), loops (for/while), and exception handling
- Extracts JavaDoc and inline comments to enrich flowchart nodes
- Generates syntax-strict Mermaid flowchart TD diagrams
- Clearly marks external dependencies and unprovided implementations
- Prevents hallucinations by strictly following provided code context

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill java-mermaid-analyzer
```

**Documentation:** See [`skills/java-mermaid-analyzer/SKILL.md`](skills/java-mermaid-analyzer/SKILL.md) for detailed specifications.

---

### first-principles-thinking

A **Rigorous Requirements Analysis and System Architecture Expert** that applies first-principles thinking to critically examine requirements, optimize implementation paths, and provide structured breakdowns.

**Features:**
- **Phase 1: Motivation & Goal Review** - Validates requirements by asking Socratic questions to uncover root problems
- **Phase 2: Path Optimization** - Evaluates proposed solutions and suggests better alternatives when suboptimal
- **Phase 3: First Principles Breakdown** - Provides MECE-based module division and granular task breakdowns
- **Rigorous Approach** - Rejects blind execution, maintains skepticism, and seeks the shortest path to solutions
- **Comprehensive Examples** - Includes real-world scenarios for unclear requirements and suboptimal paths

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill first-principles-thinking
```

**Documentation:** See [`skills/first-principles-thinking/SKILL.md`](skills/first-principles-thinking/SKILL.md) for detailed specifications.

---

### skill-creator-with-validation

An **Enhanced Skill Creator with Skills CLI Validation Expert** that guides users in creating, modifying, and validating skills for Skills CLI compatibility, ensuring proper format and avoiding common pitfalls.

**Features:**
- **Skills CLI Specification Analysis** - Validates SKILL.md front matter, YAML header, and description length constraints
- **Common Pitfalls Detection** - Identifies issues like blank lines before YAML headers, overly long descriptions, missing fields
- **Validation Checklist** - Provides comprehensive pre-publishing verification steps
- **Testing Commands** - Offers local testing commands using `npx skills add .`
- **Real-World Examples** - Includes fixed examples of Java Mermaid Analyzer and Java Arch Designer skills
- **Troubleshooting Guide** - Helps diagnose and fix common Skills CLI errors

**Install / Update:**
```bash
npx skills add Lan-zk/skills --skill skill-creator-with-validation
```

**Documentation:** See [`skills/skill-creator-with-validation/SKILL.md`](skills/skill-creator-with-validation/SKILL.md) for detailed specifications.

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
cd skills/visual-cast
npm install
node scripts/render_visual_cast.mjs --input examples/news-input.json --output-dir ./tmp/news
node scripts/render_visual_cast.mjs --mock github --output-dir ./tmp/github
```

**Documentation:** See [`skills/visual-cast/SKILL.md`](skills/visual-cast/SKILL.md) for the skill definition and [`skills/visual-cast/references/openclaw-integration.md`](skills/visual-cast/references/openclaw-integration.md) for runtime contract details.

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

**Documentation:** See [`skills/github-trending-to-card/SKILL.md`](skills/github-trending-to-card/SKILL.md) for detailed specifications.

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

## Contributing

This repository contains specialized skills for AI-assisted development. Each skill is contained in its own directory with a `SKILL.md` file describing its purpose and constraints.

## License

To be determined.
