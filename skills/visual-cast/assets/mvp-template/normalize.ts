import type { RenderItem, VisualCastItem } from "./types";

function clampText(value: string, limit: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function pickPaletteKey(type: string): string {
  switch (type) {
    case "news":
      return "blue";
    case "github_trend":
      return "green";
    case "release_note":
      return "orange";
    default:
      return "neutral";
  }
}

export function toRenderItems(items: VisualCastItem[]): RenderItem[] {
  return items.map((item) => ({
    ...item,
    titleDisplay: clampText(item.title || "未命名条目", 36),
    summaryDisplay: clampText(item.summary || "暂无摘要", 82),
    metricsDisplay: clampText(item.metrics || "", 24),
    tags: Array.isArray(item.tags) ? item.tags.slice(0, 4) : [],
    paletteKey: pickPaletteKey(item.type),
  }));
}
