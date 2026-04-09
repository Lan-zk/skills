import type { ThemeStyle, ThemeTokens } from "./types";

export const THEME_TOKENS: Record<ThemeStyle, ThemeTokens> = {
  glassmorphism: {
    background:
      "linear-gradient(135deg, rgb(19, 48, 94) 0%, rgb(97, 40, 122) 45%, rgb(241, 113, 92) 100%)",
    surface: "rgba(255,255,255,0.18)",
    surfaceAlt: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.28)",
    title: "#ffffff",
    body: "rgba(255,255,255,0.92)",
    muted: "rgba(255,255,255,0.72)",
    accent: "#ffe082",
    tagBackground: "rgba(255,255,255,0.16)",
    tagText: "#ffffff",
    radius: 30,
    shadow: "0 20px 80px rgba(15, 23, 42, 0.28)",
  },
  linear_vercel: {
    background:
      "linear-gradient(180deg, rgb(9, 9, 11) 0%, rgb(17, 24, 39) 100%)",
    surface: "rgba(17,24,39,0.88)",
    surfaceAlt: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.14)",
    title: "#f9fafb",
    body: "rgba(249,250,251,0.92)",
    muted: "rgba(156,163,175,0.88)",
    accent: "#67e8f9",
    tagBackground: "rgba(255,255,255,0.06)",
    tagText: "#d1d5db",
    radius: 18,
    shadow: "0 18px 48px rgba(0, 0, 0, 0.32)",
  },
  bento_ui: {
    background:
      "linear-gradient(180deg, rgb(246, 246, 241) 0%, rgb(234, 239, 247) 100%)",
    surface: "rgba(255,255,255,0.88)",
    surfaceAlt: "rgba(248,250,252,0.92)",
    border: "rgba(148,163,184,0.18)",
    title: "#0f172a",
    body: "#334155",
    muted: "#64748b",
    accent: "#f97316",
    tagBackground: "#e2e8f0",
    tagText: "#334155",
    radius: 26,
    shadow: "0 18px 52px rgba(148, 163, 184, 0.20)",
  },
};

export function resolveThemeTokens(themeStyle: ThemeStyle): ThemeTokens {
  return THEME_TOKENS[themeStyle];
}
