export const DEFAULT_OUTPUT_MODE = "single_cards";
export const DEFAULT_THEME_STYLE = "glassmorphism";
export const DEFAULT_OUTPUT_ENCODING = "base64";
export const DEFAULT_WIDTH = 1200;
export const DEFAULT_CARD_HEIGHT = 680;
export const DEFAULT_MAX_ITEMS = 6;

export const DEFAULT_FALLBACK_ITEM = {
  type: "fallback",
  title: "数据解析失败",
  summary: "上游内容未能稳定转换为结构化数据，请检查输入或重试。",
  tags: ["fallback"],
  metrics: "retry",
  meta: {},
};

export const MOCK_ITEMS = {
  news: [
    {
      type: "news",
      title: "OpenClaw 扩展后置处理能力",
      summary: "新版本支持更多自动化节点串联，便于将文本结果继续加工为图像内容。",
      tags: ["OpenClaw", "Automation"],
      metrics: "Daily",
      meta: {},
    },
    {
      type: "news",
      title: "Satori 文档示例更新",
      summary: "Vercel 补充了静态 SVG 渲染示例，降低图片生成链路的接入成本。",
      tags: ["Satori", "SVG"],
      metrics: "Update",
      meta: {},
    },
    {
      type: "news",
      title: "日报开始转向图像卡片",
      summary: "越来越多团队用视觉卡片替代纯文本摘要，以提升阅读体验和转发效果。",
      tags: ["Report", "Visual"],
      metrics: "Trend",
      meta: {},
    },
  ],
  github: [
    {
      type: "github_trend",
      title: "vercel/satori",
      summary: "将 React 结构渲染为 SVG，适合服务端生成静态视觉卡片。",
      tags: ["GitHub", "React", "SVG"],
      metrics: "Trend",
      meta: { repo: "vercel/satori" },
    },
    {
      type: "github_trend",
      title: "resvg-js",
      summary: "将 SVG 高性能光栅化为 PNG，适合图片工作流的最终输出阶段。",
      tags: ["GitHub", "PNG"],
      metrics: "Trend",
      meta: { repo: "thx/resvg-js" },
    },
    {
      type: "github_trend",
      title: "shadcn-ui/ui",
      summary: "提供高质量 UI 组件模式，可作为开发者审美主题的参考来源。",
      tags: ["GitHub", "UI"],
      metrics: "Trend",
      meta: { repo: "shadcn-ui/ui" },
    },
  ],
};
