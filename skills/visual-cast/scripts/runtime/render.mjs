import React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { DEFAULT_CARD_HEIGHT, DEFAULT_WIDTH } from "./constants.mjs";
import { getTheme } from "./theme.mjs";

const h = React.createElement;

function styleCard(theme) {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    padding: 38,
    borderRadius: theme.radius,
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.shadow,
    color: theme.body,
  };
}

function tagNode(tag, theme) {
  return h(
    "div",
    {
      key: tag,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 34,
        padding: "0 14px",
        borderRadius: 999,
        background: theme.tagBackground,
        color: theme.tagText,
        fontSize: 16,
        lineHeight: 1,
      },
    },
    tag,
  );
}

function chromeOrnament(theme, position) {
  const style = {
    position: "absolute",
    width: position.size,
    height: position.size,
    borderRadius: position.radius ?? position.size,
    background: theme.chromeFill,
    border: `1px solid ${theme.border}`,
    opacity: position.opacity ?? 1,
  };

  if (position.top !== undefined) style.top = position.top;
  if (position.right !== undefined) style.right = position.right;
  if (position.left !== undefined) style.left = position.left;
  if (position.bottom !== undefined) style.bottom = position.bottom;

  return h("div", { style });
}

function cardNode(item, theme, themeStyle) {
  return h(
    "div",
    { style: styleCard(theme) },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 18 } },
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: theme.accent,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 1,
            },
          },
          h("div", null, String(item.type || "BRIEF").toUpperCase()),
          themeStyle === "bento_ui"
            ? h(
                "div",
                {
                  style: {
                    color: theme.muted,
                    fontSize: 14,
                    fontWeight: 500,
                  },
                },
                `模块 ${item.tags.length || 1}`,
              )
            : null,
        ),
        h(
          "div",
          {
            style: {
              color: theme.muted,
              fontSize: 16,
              fontFamily: "VisualCast Mono",
            },
          },
          item.metrics || "Digest",
        ),
      ),
      h(
        "div",
        {
          style: {
            fontSize: themeStyle === "bento_ui" ? 36 : 40,
            lineHeight: 1.2,
            fontWeight: 800,
            color: theme.title,
          },
        },
        item.title,
      ),
      h(
        "div",
        {
          style: {
            fontSize: 22,
            lineHeight: 1.45,
            color: theme.body,
          },
        },
        item.summary,
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        },
      },
      ...(item.tags?.length ? item.tags : ["visual-cast"]).map((tag) => tagNode(tag, theme)),
    ),
  );
}

function frameNode(children, theme, width, height, themeStyle) {
  const ornaments =
    themeStyle === "linear_vercel"
      ? [
          chromeOrnament(theme, { size: 180, top: 36, right: 48, opacity: 0.45 }),
          chromeOrnament(theme, { size: 120, bottom: 40, left: 48, opacity: 0.2 }),
        ]
      : [
          chromeOrnament(theme, { size: 240, top: 28, right: 40, opacity: 0.65 }),
          chromeOrnament(theme, { size: 160, bottom: 38, left: 60, opacity: 0.35 }),
        ];

  return h(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        width,
        height,
        padding: 32,
        background: theme.background,
        overflow: "hidden",
      },
    },
    ...ornaments,
    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
        },
      },
      children,
    ),
  );
}

async function renderSvg(element, width, height, fonts) {
  return satori(element, {
    width,
    height,
    fonts,
  });
}

function svgToPng(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: width,
    },
  });
  return resvg.render().asPng();
}

export async function renderSingleCards(items, options) {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.cardHeight ?? DEFAULT_CARD_HEIGHT;
  const theme = getTheme(options.themeStyle);

  const rendered = [];

  for (const item of items) {
    const element = frameNode(cardNode(item, theme, options.themeStyle), theme, width, height, options.themeStyle);
    const svg = await renderSvg(element, width, height, options.fonts);
    const png = svgToPng(svg, width);
    rendered.push({ item, png });
  }

  return rendered;
}

export async function renderMergedImage(items, options) {
  const width = options.width ?? DEFAULT_WIDTH;
  const itemHeight = options.themeStyle === "bento_ui" ? 300 : 320;
  const height = 32 + 32 + itemHeight * items.length + 24 * Math.max(0, items.length - 1);
  const theme = getTheme(options.themeStyle);

  const stacked = h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: 24,
      },
    },
    ...items.map((item, index) =>
      h(
        "div",
        {
          key: `${item.title}-${index}`,
          style: {
            display: "flex",
            height: itemHeight,
          },
        },
        cardNode(item, theme, options.themeStyle),
      ),
    ),
  );

  const element = frameNode(stacked, theme, width, height, options.themeStyle);
  const svg = await renderSvg(element, width, height, options.fonts);
  const png = svgToPng(svg, width);

  return { png, height };
}
