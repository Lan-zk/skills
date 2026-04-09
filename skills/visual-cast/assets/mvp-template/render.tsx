import React from "react";
import type { CSSProperties, ReactElement } from "react";
import { resolveThemeTokens } from "./theme-tokens";
import type { OutputMode, RenderItem, ThemeStyle } from "./types";

function cardStyle(themeStyle: ThemeStyle): CSSProperties {
  const tokens = resolveThemeTokens(themeStyle);
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    minHeight: 360,
    padding: 36,
    borderRadius: tokens.radius,
    background: tokens.surface,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow,
    color: tokens.body,
  };
}

function tagStyle(themeStyle: ThemeStyle): CSSProperties {
  const tokens = resolveThemeTokens(themeStyle);
  return {
    display: "flex",
    alignItems: "center",
    height: 32,
    padding: "0 14px",
    borderRadius: 999,
    background: tokens.tagBackground,
    color: tokens.tagText,
    fontSize: 16,
  };
}

export function VisualCard({
  item,
  themeStyle,
}: {
  item: RenderItem;
  themeStyle: ThemeStyle;
}): ReactElement {
  const tokens = resolveThemeTokens(themeStyle);

  return (
    <div style={cardStyle(themeStyle)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: tokens.accent,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {item.type.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 16,
              color: tokens.muted,
              fontFamily: "JetBrains Mono",
            }}
          >
            {item.metricsDisplay}
          </div>
        </div>

        <div
          style={{
            fontSize: 40,
            lineHeight: 1.2,
            fontWeight: 800,
            color: tokens.title,
          }}
        >
          {item.titleDisplay}
        </div>

        <div
          style={{
            fontSize: 22,
            lineHeight: 1.45,
            color: tokens.body,
          }}
        >
          {item.summaryDisplay}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {item.tags.map((tag) => (
          <div key={tag} style={tagStyle(themeStyle)}>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}

export function createSingleCardTree(
  item: RenderItem,
  themeStyle: ThemeStyle,
  width = 1200,
  height = 680,
): ReactElement {
  const tokens = resolveThemeTokens(themeStyle);

  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        padding: 32,
        background: tokens.background,
      }}
    >
      <VisualCard item={item} themeStyle={themeStyle} />
    </div>
  );
}

export function createMergedLongImageTree(
  items: RenderItem[],
  themeStyle: ThemeStyle,
  width = 1200,
): ReactElement {
  const tokens = resolveThemeTokens(themeStyle);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        padding: 32,
        gap: 24,
        background: tokens.background,
      }}
    >
      {items.map((item, index) => (
        <div key={`${item.titleDisplay}-${index}`} style={{ display: "flex" }}>
          <VisualCard item={item} themeStyle={themeStyle} />
        </div>
      ))}
    </div>
  );
}

export function createRenderTree(args: {
  items: RenderItem[];
  outputMode: OutputMode;
  themeStyle: ThemeStyle;
  width?: number;
}): ReactElement | ReactElement[] {
  const { items, outputMode, themeStyle, width } = args;

  if (outputMode === "single_cards") {
    return items.map((item) => createSingleCardTree(item, themeStyle, width));
  }

  return createMergedLongImageTree(items, themeStyle, width);
}
