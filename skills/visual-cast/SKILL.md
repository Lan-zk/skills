---
name: visual-cast
description: Convert upstream text or Markdown into shareable visual cards or merged long images for OpenClaw workflows. Use when Codex needs to normalize heterogeneous content with an LLM, render with Satori plus @resvg/resvg-js, expose output_mode and theme_style parameters, or return PNG/base64 image output for messaging and social distribution.
---

# Visual Cast

Generate image-first outputs from upstream OpenClaw text payloads.

## Core Contract

- Accept raw text or Markdown from any upstream skill.
- Normalize the payload into a strict JSON array before rendering.
- Support `output_mode` with `single_cards` or `merged_long_image`.
- Support `theme_style` with `glassmorphism`, `linear_vercel`, or `bento_ui`.
- Return PNG binary, base64, or file paths that downstream OpenClaw nodes can consume.

Read [references/normalization-contract.md](references/normalization-contract.md) when you need the JSON schema, the normalization prompt contract, or the fallback rules.

Read [references/theme-spec.md](references/theme-spec.md) when you need layout and styling guidance for the three themes.

Read [references/llm-prompt-template.md](references/llm-prompt-template.md) when you need a ready-to-use system prompt and retry prompt for normalization.

Read [references/openclaw-integration.md](references/openclaw-integration.md) when you need input and output payload examples for OpenClaw wiring.

Use [scripts/validate_visual_cast_json.py](scripts/validate_visual_cast_json.py) to repair common JSON formatting issues and coerce model output into a render-safe schema before calling Satori.

Reuse files in [assets/mvp-template](assets/mvp-template) when you need a starting implementation for types, theme tokens, normalization mapping, or Satori render composition.

Use [package.json](package.json) plus [scripts/render_visual_cast.mjs](scripts/render_visual_cast.mjs) when the goal is not planning but directly generating PNG output for OpenClaw.

## Workflow

### 1. Validate Inputs

Require these inputs unless the user explicitly defines alternatives:

- `content`: upstream raw text or Markdown.
- `output_mode`: default to `single_cards`.
- `theme_style`: default to `glassmorphism`.

If the upstream data already contains structured JSON close to the target schema, reuse it instead of re-summarizing the content.

### 2. Normalize with the LLM

Turn the upstream content into a JSON array that matches the normalization contract exactly.

Rules:

- Keep `title` short enough to fit one card headline.
- Keep `summary` concise; target 30-50 Chinese characters or equivalent short English copy.
- Preserve only the highest-signal tags and metrics.
- Store non-standard fields inside `meta`.
- Do not invent facts that are not present in the source material.

If the first JSON response is invalid:

1. Try a lightweight repair pass.
2. Retry normalization once if repair fails.
3. If the second attempt still fails, render a fallback placeholder image that states data parsing failed.

Prefer the bundled prompt templates first, then run the bundled JSON validator before deciding that the model output is unusable.

### 3. Map Data to a Render Model

Prepare a render-safe structure before calling Satori:

- Pre-truncate text that may overflow.
- Convert absent arrays or metrics to safe empty values.
- Resolve theme tokens from `theme_style`.
- For `merged_long_image`, compute the outer container and vertical stacking order first.

Do not depend on client-side JavaScript for layout or charts. If the card needs a chart, require an upstream static image URL and render it as an image asset.

### 4. Render

Preferred render chain:

1. Build Satori-compatible React elements.
2. Render SVG via Satori.
3. Rasterize SVG to PNG via `@resvg/resvg-js`.

Target the render stage itself at under 500ms, excluding LLM latency.

The bundled runnable implementation already follows this chain. Prefer reusing it before rewriting a new renderer.

### 5. Produce Delivery Artifacts

Return one of these forms based on the surrounding workflow:

- PNG buffer
- base64 PNG string
- saved PNG file path plus metadata

When multiple images are produced in `single_cards` mode, preserve item order from the normalized JSON array.

## Theme Selection

- `glassmorphism`: default choice for polished info cards and social sharing.
- `linear_vercel`: use for developer-facing or technical updates with stronger information density.
- `bento_ui`: use when `merged_long_image` needs modular sections and efficient vertical composition.

If the user does not specify a theme, default to `glassmorphism`. If the user asks for a highly technical or hacker-like presentation, prefer `linear_vercel`. If the user asks for a long summary image or dashboard-like composition, prefer `bento_ui`.

## Rendering Guardrails

- Clamp long text with ellipsis or multi-line truncation.
- Embed or load at least one Chinese font such as Noto Sans SC plus one monospace Latin font for metrics and code-like snippets.
- Use deterministic spacing, padding, and card dimensions so outputs remain stable across runs.
- Keep contrast high enough for messaging apps and mobile previews.
- Avoid unsupported browser-only CSS or runtime DOM assumptions.

## OpenClaw Integration

When implementing or modifying the skill in code, preserve this boundary:

- Input side: raw upstream text plus skill parameters.
- Internal stages: normalize -> validate/repair -> render model -> SVG -> PNG.
- Output side: image artifact plus minimal execution metadata.

Expose configuration clearly to the caller:

- `output_mode`
- `theme_style`
- optional width, max item count, font path, and output encoding

## Output Expectations

When the user asks for implementation work, produce:

- the normalization prompt or schema wiring
- the renderer structure for the chosen `output_mode`
- theme tokens or component templates for the chosen `theme_style`
- the final output contract for downstream OpenClaw nodes

When the user asks only for planning or design, provide the same architecture without claiming code has already been implemented.

## Bundled Resources

### `scripts/validate_visual_cast_json.py`

Run this script when the LLM returns JSON with wrappers, code fences, trailing commas, or partial schema drift.

Typical usage:

```bash
python3 scripts/validate_visual_cast_json.py response.json
python3 scripts/validate_visual_cast_json.py --stdin < model-output.txt
```

The script:

- strips Markdown fences
- extracts the JSON body
- repairs trailing commas
- validates required fields
- normalizes tags and meta
- optionally emits a fallback item when repair fails

### `references/llm-prompt-template.md`

Use this file to copy the base system prompt, user prompt wrapper, and retry prompt without rewriting them from scratch.

### `references/openclaw-integration.md`

Use this file when implementing the node contract, passing runtime parameters, or documenting downstream image outputs.

### `assets/mvp-template/`

Use this template set when the task is no longer conceptual and needs code structure quickly.

Included files:

- `types.ts`: shared contracts for input, normalized items, theme keys, and outputs
- `theme-tokens.ts`: baseline tokens for the three supported themes
- `normalize.ts`: render-safe mapping from raw normalized items to display items
- `render.tsx`: Satori-compatible JSX composition for single cards and merged long images

Treat these files as a starting point, not as immutable framework code. Adapt sizes, spacing, and output encoding to the host runtime.

### `package.json` and `scripts/render_visual_cast.mjs`

Use these files for direct execution.

Typical commands:

```bash
npm install
node scripts/render_visual_cast.mjs --input examples/news-input.json --output-dir ./tmp/news
node scripts/render_visual_cast.mjs --mock github --output-dir ./tmp/github
cat payload.json | node scripts/render_visual_cast.mjs --stdin --json-output ./tmp/result.json
```

The current implementation supports:

- raw content payloads via file or stdin
- normalized item payloads via `normalized_items`
- `single_cards` and `merged_long_image`
- `glassmorphism`, `linear_vercel`, and `bento_ui`
- `base64` or `file` output encoding
