import OpenAI from "openai";
import { DEFAULT_MAX_ITEMS } from "./constants.mjs";
import { sanitizeItems } from "./normalize.mjs";

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const NORMALIZATION_SCHEMA = {
  name: "visual_cast_normalized_items",
  schema: {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["type", "title", "summary", "tags", "metrics", "meta"],
      properties: {
        type: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        tags: {
          type: "array",
          items: { type: "string" },
        },
        metrics: { type: "string" },
        meta: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are the normalization layer for Visual Cast in an OpenClaw workflow.

Your job is to convert raw upstream text or Markdown into a JSON array only.

Output requirements:
1. Return valid JSON only.
2. The top-level value must be an array.
3. Every item must contain:
   - type: string
   - title: string
   - summary: string
   - tags: string[]
   - metrics: string
   - meta: object
4. Keep title concise and card-safe.
5. Keep summary concise, ideally 30-50 Chinese characters or a similarly short English summary.
6. Preserve facts and numbers from the source. Do not invent missing facts.
7. Remove duplicate noise. Keep only the highest-signal items.
8. Put any extra structured data into meta.
9. If the source contains multiple items, emit one object per item.`;

function buildUserPrompt(payload) {
  const typeHint = payload?.type_hint || "auto";
  const maxItems = payload?.max_items || DEFAULT_MAX_ITEMS;
  const language = payload?.language || "match-source";
  const rawContent = payload?.content || "";

  return `Normalize the following upstream content for Visual Cast.

Expected category hint: ${typeHint}
Maximum items: ${maxItems}
Preferred language: ${language}

Upstream content:
${rawContent}`;
}

function buildRetryPrompt(payload) {
  return `Your previous output did not satisfy the contract.

Return valid JSON only.
- Top-level array only
- Every item must include type, title, summary, tags, metrics, meta
- Preserve the same factual meaning as the original content

Original content:
${payload?.content || ""}`;
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

function extractText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }
  return "";
}

async function requestNormalization(client, model, payload, isRetry = false) {
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: isRetry ? buildRetryPrompt(payload) : buildUserPrompt(payload),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: NORMALIZATION_SCHEMA.name,
        strict: true,
        schema: NORMALIZATION_SCHEMA.schema,
      },
    },
  });

  const outputText = extractText(response);
  if (!outputText) {
    throw new Error("OpenAI response did not contain output_text.");
  }

  return JSON.parse(outputText);
}

export function canUseLLM(payload, options = {}) {
  if (options.disableLLM) {
    return false;
  }
  if (Array.isArray(payload)) {
    return false;
  }
  if (Array.isArray(payload?.normalized_items) || Array.isArray(payload?.items)) {
    return false;
  }
  if (!payload?.content || !String(payload.content).trim()) {
    return false;
  }
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function normalizeWithLLM(payload, options = {}) {
  const client = getClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is required for LLM normalization.");
  }

  const model = options.model || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  try {
    const items = await requestNormalization(client, model, payload, false);
    return {
      items: sanitizeItems(items, payload),
      metadata: { enabled: true, model, retried: false, provider: "openai" },
    };
  } catch (firstError) {
    const items = await requestNormalization(client, model, payload, true);
    return {
      items: sanitizeItems(items, payload),
      metadata: {
        enabled: true,
        model,
        retried: true,
        provider: "openai",
        initial_error: firstError.message,
      },
    };
  }
}

