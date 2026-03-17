import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MOCK_ITEMS } from "./constants.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");

export function getRootDir() {
  return ROOT_DIR;
}

export async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
}

export function resolveMockPayload(name) {
  if (name === "news") {
    return {
      normalized_items: MOCK_ITEMS.news,
      output_mode: "single_cards",
      theme_style: "glassmorphism",
      output_encoding: "file",
      width: 1200,
    };
  }

  if (name === "github") {
    return {
      normalized_items: MOCK_ITEMS.github,
      output_mode: "merged_long_image",
      theme_style: "linear_vercel",
      output_encoding: "file",
      width: 1200,
    };
  }

  throw new Error(`Unknown mock payload: ${name}`);
}
