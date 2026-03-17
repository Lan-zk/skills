# OpenClaw Integration

Use this file when wiring Visual Cast into an OpenClaw node or documenting its runtime contract.

## Direct Runtime

The skill now includes a runnable Node entry:

```bash
cd visual-cast
npm install
node scripts/render_visual_cast.mjs --input examples/news-input.json --output-dir ./tmp/news
```

Mock entry points:

```bash
node scripts/render_visual_cast.mjs --mock news --output-dir ./tmp/news
node scripts/render_visual_cast.mjs --mock github --output-dir ./tmp/github
```

stdin entry:

```bash
cat payload.json | node scripts/render_visual_cast.mjs --stdin --json-output ./tmp/result.json
```

The renderer supports:

- payload file input
- stdin input
- bundled mock payloads
- `file` or `base64` image output encoding

## Recommended Input Shape

```json
{
  "content": "raw upstream markdown or text",
  "output_mode": "single_cards",
  "theme_style": "glassmorphism",
  "type_hint": "news",
  "max_items": 6,
  "output_encoding": "base64",
  "width": 1200,
  "font_family_sans": "Noto Sans SC",
  "font_family_mono": "JetBrains Mono"
}
```

Required:

- `content`

Defaulted when absent:

- `output_mode`: `single_cards`
- `theme_style`: `glassmorphism`
- `output_encoding`: `base64`
- `max_items`: implementation-defined, usually 4-8

## Internal Pipeline

```text
raw content
-> llm normalization
-> json repair/validation
-> render model mapping
-> satori svg
-> resvg png
-> output artifact
```

## Recommended Output Shape

### Single Cards

```json
{
  "success": true,
  "output_mode": "single_cards",
  "theme_style": "glassmorphism",
  "images": [
    {
      "index": 0,
      "type": "news",
      "title": "示例标题",
      "mime_type": "image/png",
      "encoding": "base64",
      "data": "iVBORw0KGgoAAA..."
    }
  ],
  "normalized_items": 1
}
```

### Merged Long Image

```json
{
  "success": true,
  "output_mode": "merged_long_image",
  "theme_style": "bento_ui",
  "image": {
    "mime_type": "image/png",
    "encoding": "base64",
    "data": "iVBORw0KGgoAAA..."
  },
  "normalized_items": 6
}
```

## Failure Shape

```json
{
  "success": false,
  "error_code": "NORMALIZATION_FAILED",
  "message": "Failed to produce valid normalized JSON after one repair pass and one retry.",
  "fallback_rendered": true
}
```

## Implementation Notes

- Keep normalized data and final image outputs both available during debugging.
- Preserve item order from the normalized array.
- Include `type` and `title` in image metadata so downstream nodes can route or caption images.
- If the caller needs binary buffers instead of base64, keep the response shape identical and swap the encoding field.
