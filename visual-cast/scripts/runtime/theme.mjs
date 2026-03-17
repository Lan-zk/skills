export const THEMES = {
  glassmorphism: {
    background:
      "linear-gradient(135deg, rgb(16, 37, 66) 0%, rgb(90, 52, 143) 46%, rgb(234, 122, 87) 100%)",
    surface: "rgba(255,255,255,0.18)",
    surfaceAlt: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.28)",
    title: "#ffffff",
    body: "rgba(255,255,255,0.94)",
    muted: "rgba(255,255,255,0.72)",
    accent: "#ffd166",
    tagBackground: "rgba(255,255,255,0.15)",
    tagText: "#ffffff",
    radius: 30,
    shadow: "0 24px 72px rgba(15, 23, 42, 0.28)",
    chromeFill: "rgba(255,255,255,0.10)",
  },
  linear_vercel: {
    background:
      "linear-gradient(180deg, rgb(9, 9, 11) 0%, rgb(17, 24, 39) 100%)",
    surface: "rgba(17,24,39,0.88)",
    surfaceAlt: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.12)",
    title: "#f9fafb",
    body: "rgba(249,250,251,0.92)",
    muted: "rgba(156,163,175,0.88)",
    accent: "#67e8f9",
    tagBackground: "rgba(255,255,255,0.06)",
    tagText: "#d1d5db",
    radius: 18,
    shadow: "0 18px 48px rgba(0, 0, 0, 0.32)",
    chromeFill: "rgba(255,255,255,0.02)",
  },
  bento_ui: {
    background:
      "linear-gradient(180deg, rgb(246, 246, 241) 0%, rgb(233, 241, 248) 100%)",
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
    chromeFill: "rgba(255,255,255,0.55)",
  },
};

export function getTheme(themeStyle) {
  return THEMES[themeStyle] ?? THEMES.glassmorphism;
}
