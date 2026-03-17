# Mock Examples

Use this file when building an MVP, testing prompts, or verifying card layout without waiting for live upstream skills.

## Example 1: News Digest

Raw input:

```text
今日 AI 新闻摘要：
1. OpenClaw 发布新的自动化能力，支持更多后置处理节点。
2. Vercel 更新了 Satori 文档，改进静态 SVG 渲染示例。
3. 多个团队开始将日报从纯文本改为图片卡片，以提升可读性。
```

Expected normalized output:

```json
[
  {
    "type": "news",
    "title": "OpenClaw 扩展后置处理能力",
    "summary": "新版本支持更多自动化节点串联，便于将文本结果继续加工为图像内容。",
    "tags": ["OpenClaw", "Automation"],
    "metrics": "Daily",
    "meta": {}
  },
  {
    "type": "news",
    "title": "Satori 文档示例更新",
    "summary": "Vercel 补充了静态 SVG 渲染示例，降低图片生成链路的接入成本。",
    "tags": ["Satori", "SVG"],
    "metrics": "Update",
    "meta": {}
  },
  {
    "type": "news",
    "title": "日报开始转向图像卡片",
    "summary": "越来越多团队用视觉卡片替代纯文本摘要，以提升阅读体验和转发效果。",
    "tags": ["Report", "Visual"],
    "metrics": "Trend",
    "meta": {}
  }
]
```

## Example 2: GitHub Trends

Raw input:

```markdown
# GitHub Trending
- vercel/satori: React to SVG
- thx/resvg-js: SVG to PNG renderer
- shadcn-ui/ui: reusable UI components
```

Expected normalized output:

```json
[
  {
    "type": "github_trend",
    "title": "vercel/satori",
    "summary": "将 React 结构渲染为 SVG，适合服务端生成静态视觉卡片。",
    "tags": ["GitHub", "React", "SVG"],
    "metrics": "Trend",
    "meta": {
      "repo": "vercel/satori"
    }
  },
  {
    "type": "github_trend",
    "title": "resvg-js",
    "summary": "将 SVG 高性能光栅化为 PNG，适合图片工作流的最终输出阶段。",
    "tags": ["GitHub", "PNG"],
    "metrics": "Trend",
    "meta": {
      "repo": "thx/resvg-js"
    }
  },
  {
    "type": "github_trend",
    "title": "shadcn-ui/ui",
    "summary": "提供高质量 UI 组件模式，可作为开发者审美主题的参考来源。",
    "tags": ["GitHub", "UI"],
    "metrics": "Trend",
    "meta": {
      "repo": "shadcn-ui/ui"
    }
  }
]
```
