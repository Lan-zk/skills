import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");

const SANS_REGULAR_CANDIDATES = [
  process.env.VISUAL_CAST_FONT_SANS,
  path.join(
    ROOT_DIR,
    "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff",
  ),
  path.join(
    ROOT_DIR,
    "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-latin-400-normal.woff",
  ),
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
].filter(Boolean);

const SANS_BOLD_CANDIDATES = [
  process.env.VISUAL_CAST_FONT_SANS_BOLD,
  path.join(
    ROOT_DIR,
    "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff",
  ),
  path.join(
    ROOT_DIR,
    "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-latin-700-normal.woff",
  ),
  process.env.VISUAL_CAST_FONT_SANS,
].filter(Boolean);

const MONO_REGULAR_CANDIDATES = [
  process.env.VISUAL_CAST_FONT_MONO,
  path.join(
    ROOT_DIR,
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
  ),
  "/System/Library/Fonts/SFNSMono.ttf",
].filter(Boolean);

const MONO_BOLD_CANDIDATES = [
  process.env.VISUAL_CAST_FONT_MONO_BOLD,
  path.join(
    ROOT_DIR,
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff",
  ),
  process.env.VISUAL_CAST_FONT_MONO,
].filter(Boolean);

async function firstReadable(paths) {
  for (const path of paths) {
    try {
      const data = await fs.readFile(path);
      return { path, data };
    } catch {
      // continue
    }
  }
  throw new Error(`No readable font found. Tried: ${paths.join(", ")}`);
}

export async function loadFonts() {
  const sansRegular = await firstReadable(SANS_REGULAR_CANDIDATES);
  const sansBold = await firstReadable(SANS_BOLD_CANDIDATES);
  const monoRegular = await firstReadable(MONO_REGULAR_CANDIDATES);
  const monoBold = await firstReadable(MONO_BOLD_CANDIDATES);

  return {
    fonts: [
      {
        name: "VisualCast Sans",
        data: sansRegular.data,
        weight: 400,
        style: "normal",
      },
      {
        name: "VisualCast Sans",
        data: sansBold.data,
        weight: 700,
        style: "normal",
      },
      {
        name: "VisualCast Mono",
        data: monoRegular.data,
        weight: 400,
        style: "normal",
      },
      {
        name: "VisualCast Mono",
        data: monoBold.data,
        weight: 700,
        style: "normal",
      },
    ],
    resolved: {
      sans_regular: sansRegular.path,
      sans_bold: sansBold.path,
      mono_regular: monoRegular.path,
      mono_bold: monoBold.path,
    },
  };
}
