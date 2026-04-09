#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { DEFAULT_OUTPUT_ENCODING, DEFAULT_OUTPUT_MODE, DEFAULT_THEME_STYLE } from "./runtime/constants.mjs";
import { loadFonts } from "./runtime/fonts.mjs";
import { ensureDir, getRootDir, readJsonFile, resolveMockPayload, writeFile } from "./runtime/io.mjs";
import { normalizeFromPayload } from "./runtime/normalize.mjs";
import { canUseLLM, normalizeWithLLM } from "./runtime/llm.mjs";
import { renderMergedImage, renderSingleCards } from "./runtime/render.mjs";

function parseArgs(argv) {
  const args = {
    outputMode: undefined,
    themeStyle: undefined,
    outputEncoding: undefined,
    width: undefined,
    input: undefined,
    outputDir: undefined,
    jsonOutput: undefined,
    mock: undefined,
    stdin: false,
    disableLLM: false,
    model: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--input":
        args.input = next;
        index += 1;
        break;
      case "--output-mode":
        args.outputMode = next;
        index += 1;
        break;
      case "--theme-style":
        args.themeStyle = next;
        index += 1;
        break;
      case "--output-encoding":
        args.outputEncoding = next;
        index += 1;
        break;
      case "--width":
        args.width = Number(next);
        index += 1;
        break;
      case "--output-dir":
        args.outputDir = next;
        index += 1;
        break;
      case "--json-output":
        args.jsonOutput = next;
        index += 1;
        break;
      case "--mock":
        args.mock = next;
        index += 1;
        break;
      case "--stdin":
        args.stdin = true;
        break;
      case "--disable-llm":
        args.disableLLM = true;
        break;
      case "--model":
        args.model = next;
        index += 1;
        break;
      case "--help":
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  process.stdout.write(`Visual Cast PNG renderer

Usage:
  node scripts/render_visual_cast.mjs --input examples/news-input.json --output-dir ./tmp/news
  node scripts/render_visual_cast.mjs --mock news --output-dir ./tmp/news
  cat payload.json | node scripts/render_visual_cast.mjs --stdin --json-output ./tmp/result.json

Options:
  --input <file>            Read OpenClaw payload JSON from file
  --stdin                   Read payload JSON from stdin
  --mock <news|github>      Use bundled mock payload
  --disable-llm             Force local heuristic normalization only
  --model <name>            Override OpenAI model for normalization
  --output-mode <mode>      Override output mode
  --theme-style <theme>     Override theme style
  --output-encoding <enc>   base64 | file
  --width <number>          Override width, default 1200
  --output-dir <dir>        Directory for PNG files when encoding=file
  --json-output <file>      Write final result JSON to file instead of stdout
`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function loadPayload(args) {
  if (args.mock) {
    return resolveMockPayload(args.mock);
  }

  if (args.stdin) {
    const content = await readStdin();
    return JSON.parse(content);
  }

  if (args.input) {
    return readJsonFile(path.resolve(process.cwd(), args.input));
  }

  throw new Error("Provide --input, --stdin, or --mock.");
}

function toPublicImage(image) {
  return {
    ...image,
    mime_type: "image/png",
  };
}

async function maybeWriteJson(result, outputPath) {
  const rendered = `${JSON.stringify(result, null, 2)}\n`;
  if (outputPath) {
    await writeFile(path.resolve(process.cwd(), outputPath), rendered);
    return;
  }
  process.stdout.write(rendered);
}

async function writeImages(rendered, outputDir) {
  const root = outputDir
    ? path.resolve(process.cwd(), outputDir)
    : path.join(getRootDir(), "tmp", `render-${Date.now()}`);
  await ensureDir(root);

  return Promise.all(
    rendered.map(async ({ item, png }, index) => {
      const fileName = `${String(index).padStart(2, "0")}-${slugify(item.title)}.png`;
      const filePath = path.join(root, fileName);
      await fs.writeFile(filePath, png);
      return {
        index,
        type: item.type,
        title: item.title,
        encoding: "file",
        data: filePath,
      };
    }),
  );
}

async function writeMergedImage(png, outputDir, themeStyle) {
  const root = outputDir
    ? path.resolve(process.cwd(), outputDir)
    : path.join(getRootDir(), "tmp", `render-${Date.now()}`);
  await ensureDir(root);
  const filePath = path.join(root, `merged-${themeStyle}.png`);
  await fs.writeFile(filePath, png);
  return {
    mime_type: "image/png",
    encoding: "file",
    data: filePath,
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "visual-cast";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = await loadPayload(args);
  const outputMode = args.outputMode || payload.output_mode || DEFAULT_OUTPUT_MODE;
  const themeStyle = args.themeStyle || payload.theme_style || DEFAULT_THEME_STYLE;
  const outputEncoding = args.outputEncoding || payload.output_encoding || DEFAULT_OUTPUT_ENCODING;
  const width = args.width || payload.width || 1200;

  let items;
  let normalization;

  if (canUseLLM(payload, args)) {
    normalization = await normalizeWithLLM(payload, { disableLLM: args.disableLLM, model: args.model });
    items = normalization.items;
  } else {
    items = normalizeFromPayload(payload);
    normalization = {
      metadata: {
        enabled: false,
        reason: args.disableLLM ? "disabled" : process.env.OPENAI_API_KEY ? "not_needed" : "missing_api_key",
      },
    };
  }

  const { fonts, resolved } = await loadFonts();
  const renderOptions = {
    width,
    themeStyle,
    fonts,
  };

  if (outputMode === "single_cards") {
    const rendered = await renderSingleCards(items, renderOptions);
    const images =
      outputEncoding === "file"
        ? await writeImages(rendered, args.outputDir)
        : rendered.map(({ item, png }, index) => ({
            index,
            type: item.type,
            title: item.title,
            encoding: "base64",
            data: Buffer.from(png).toString("base64"),
          }));

    await maybeWriteJson(
      {
        success: true,
        output_mode: outputMode,
        theme_style: themeStyle,
        normalized_items: items.length,
        normalization: normalization.metadata,
        fonts: resolved,
        images: images.map(toPublicImage),
      },
      args.jsonOutput,
    );
    return;
  }

  const merged = await renderMergedImage(items, renderOptions);
  const image =
    outputEncoding === "file"
      ? await writeMergedImage(merged.png, args.outputDir, themeStyle)
      : {
          mime_type: "image/png",
          encoding: "base64",
          data: Buffer.from(merged.png).toString("base64"),
        };

  await maybeWriteJson(
    {
      success: true,
      output_mode: outputMode,
      theme_style: themeStyle,
      normalized_items: items.length,
      normalization: normalization.metadata,
      fonts: resolved,
      image,
    },
    args.jsonOutput,
  );
}

main().catch((error) => {
  process.stderr.write(`visual-cast render failed: ${error.message}\n`);
  process.exit(1);
});
