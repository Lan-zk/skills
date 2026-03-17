import { DEFAULT_FALLBACK_ITEM, DEFAULT_MAX_ITEMS } from "./constants.mjs";

function clamp(text, limit) {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function sanitizeItems(items, options = {}) {
  const { maxItems = DEFAULT_MAX_ITEMS } = options;
  const normalized = ensureArray(items)
    .slice(0, maxItems)
    .map((item) => ({
      type: clamp(item?.type || "unknown", 24) || "unknown",
      title: clamp(item?.title || "未命名条目", 40),
      summary: clamp(item?.summary || "暂无摘要", 90),
      tags: ensureArray(item?.tags)
        .map((tag) => clamp(tag, 18))
        .filter(Boolean)
        .slice(0, 4),
      metrics: clamp(item?.metrics || "", 26),
      meta: item?.meta && typeof item.meta === "object" ? item.meta : {},
    }))
    .filter((item) => item.title && item.summary);

  return normalized.length > 0 ? normalized : [DEFAULT_FALLBACK_ITEM];
}

function parseListItems(content, { typeHint = "brief", maxItems = DEFAULT_MAX_ITEMS } = {}) {
  const lines = String(content)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const listLines = lines.filter((line) => /^(\d+[.)]|[-*•])\s+/.test(line));

  if (listLines.length === 0) {
    const summary = clamp(content, 90) || DEFAULT_FALLBACK_ITEM.summary;
    return [
      {
        type: typeHint,
        title: clamp(lines[0] || "信息摘要", 40),
        summary,
        tags: [typeHint],
        metrics: "Digest",
        meta: {},
      },
    ];
  }

  return listLines.slice(0, maxItems).map((line, index) => {
    const cleaned = line.replace(/^(\d+[.)]|[-*•])\s+/, "").trim();
    const [left, ...rest] = cleaned.split(/[:：-]\s+/);
    const summary = rest.join(" - ").trim() || cleaned;

    return {
      type: typeHint,
      title: clamp(left || `条目 ${index + 1}`, 40),
      summary: clamp(summary, 90),
      tags: buildTags(typeHint, cleaned),
      metrics: inferMetrics(typeHint, cleaned),
      meta: {},
    };
  });
}

function buildTags(typeHint, text) {
  const tags = [typeHint];
  if (/github|repo|star/i.test(text)) {
    tags.push("GitHub");
  }
  if (/svg/i.test(text)) {
    tags.push("SVG");
  }
  if (/png/i.test(text)) {
    tags.push("PNG");
  }
  if (/react/i.test(text)) {
    tags.push("React");
  }

  return Array.from(new Set(tags)).slice(0, 4);
}

function inferMetrics(typeHint, text) {
  if (typeHint === "github_trend") {
    return "Trend";
  }
  if (/daily|日报|今日/.test(text)) {
    return "Daily";
  }
  return "Digest";
}

export function normalizeFromPayload(payload) {
  if (Array.isArray(payload)) {
    return sanitizeItems(payload);
  }

  if (Array.isArray(payload?.normalized_items)) {
    return sanitizeItems(payload.normalized_items, payload);
  }

  if (Array.isArray(payload?.items)) {
    return sanitizeItems(payload.items, payload);
  }

  return sanitizeItems(
    parseListItems(payload?.content || "", {
      typeHint: payload?.type_hint || "brief",
      maxItems: payload?.max_items,
    }),
    payload,
  );
}
