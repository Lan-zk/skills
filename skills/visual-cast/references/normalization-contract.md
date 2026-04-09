# Normalization Contract

Use this file when you need the JSON contract, prompt instructions, or error handling for LLM normalization.

## Target Schema

The normalized result must be a JSON array:

```json
[
  {
    "type": "string",
    "title": "string",
    "summary": "string",
    "tags": ["string"],
    "metrics": "string",
    "meta": {}
  }
]
```

Field rules:

- `type`: business category such as `news`, `github_trend`, `brief`, `release_note`.
- `title`: concise headline suitable for a card title.
- `summary`: concise summary; keep it within 30-50 Chinese characters or an equivalent short English length.
- `tags`: 0-4 short tags.
- `metrics`: a compact metric string such as `Star +500` or `🔥 热度 99`.
- `meta`: reserved object for future compatibility. Put extra structured fields here.

## Normalization Prompt Pattern

Use a system prompt with these constraints:

1. Convert messy text or Markdown into the target JSON array only.
2. Do not output Markdown fences or explanations.
3. Keep titles and summaries short enough for fixed-size cards.
4. Preserve facts, numbers, names, and source meaning.
5. Merge duplicate points and discard low-value noise.
6. If the source contains multiple items, emit one JSON object per item.
7. Put fields that do not fit the standard schema into `meta`.

Recommended user-prompt inputs:

- raw upstream content
- optional expected category hint
- optional max item count
- optional output language hint

## Validation Rules

After normalization, validate:

- top-level structure is an array
- every item contains all required fields
- `tags` is an array
- `meta` is an object
- strings are trimmed
- titles and summaries do not exceed the rendering budget

Repair strategy:

1. Try JSON repair for common issues such as trailing commas, missing quotes, or wrapped fences.
2. If repair fails, re-run one normalization attempt with stricter instructions.
3. If still invalid, emit a fallback placeholder image instead of crashing the workflow.

## Fallback Copy

Use brief fallback copy when rendering a failure placeholder:

- Title: `数据解析失败`
- Summary: `上游内容未能稳定转换为结构化数据，请检查输入或重试。`
- Tags: `["fallback"]`
- Metrics: `retry`

## Example

Input pattern:

```text
GitHub Trending
1. vercel/satori - SVG renderer for React
2. resvg/resvg-js - high performance SVG to PNG
```

Expected normalized shape:

```json
[
  {
    "type": "github_trend",
    "title": "Satori SVG 渲染引擎",
    "summary": "React 结构可直接转为 SVG，适合静态卡片渲染链路。",
    "tags": ["GitHub", "SVG", "React"],
    "metrics": "Trend",
    "meta": {
      "repo": "vercel/satori"
    }
  },
  {
    "type": "github_trend",
    "title": "resvg-js 光栅化工具",
    "summary": "将 SVG 高性能转换为 PNG，适合服务端图片输出。",
    "tags": ["GitHub", "PNG"],
    "metrics": "Trend",
    "meta": {
      "repo": "resvg/resvg-js"
    }
  }
]
```
