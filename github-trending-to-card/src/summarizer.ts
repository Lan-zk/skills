import { createReadmeClient, type ReadmeClient } from './readmeClient';
import { createLlmClient } from './llmClient';
import type { TrendingItem } from './types';

const SUMMARY_SYSTEM_PROMPT = `你是一位资深开源项目评审编辑，擅长从 README 和代码结构中提炼项目本质。`;

const SUMMARY_USER_PROMPT = `# 项目信息
项目名：{owner}/{name}
原始描述：{description}

# README 片段（已截取前 4KB）
{readme}

# 输出要求
请分析 README 内容，回答以下两个核心问题，输出中文：

<b>项目解析</b>
解决的问题：{一句话描述该项目旨在解决的核心问题/痛点}
解决方案：{该项目的核心实现思路或方法}

规则：
- 总字数控制在 70-150 字
- 使用 <b> 标签包裹"项目解析"标题
- 不得添加 README 中不存在的虚构信息`;

function buildSummaryUserMessage(item: TrendingItem, readme: string): string {
  return SUMMARY_USER_PROMPT
    .replace('{owner}', item.owner)
    .replace('{name}', item.name)
    .replace('{description}', item.description || '无')
    .replace('{readme}', readme || '（README 不可用）');
}

function parseAiIntro(text: string): string {
  const match = text.match(/<b>项目解析<\/b>[\s\S]*/);
  return match ? match[0].trim() : '';
}

export async function summarizeReadmes(
  items: TrendingItem[],
  clientFactory: () => ReturnType<typeof createLlmClient> = createLlmClient,
  readmeClient: ReadmeClient = createReadmeClient(),
): Promise<TrendingItem[]> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    console.warn('LLM_API_KEY not set, skipping AI intro generation');
    return items.map((item) => ({ ...item, ai_intro: undefined }));
  }

  if (items.length === 0) {
    return items;
  }

  const readmeResults = await Promise.allSettled(
    items.map((item) => readmeClient.fetchReadme(item.owner, item.name)),
  );

  const readmes = readmeResults.map((r) =>
    r.status === 'fulfilled' ? r.value : '',
  );

  const userMessages = items.map((item, i) =>
    buildSummaryUserMessage(item, readmes[i]),
  );

  const combinedUserMessage = userMessages
    .map((msg, i) => `## 项目 ${i + 1}\n${msg}`)
    .join('\n\n---\n\n');

  const model = process.env.LLM_MODEL || 'Qwen/Qwen2.5-72B-Instruct';
  const client = clientFactory();

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: combinedUserMessage },
      ],
      max_tokens: 2048,
    });

    const text = response.choices[0]?.message?.content || '';

    // LLM may or may not include "## 项目 N" prefix per item.
    // Try matchAll first (multi-item with prefix), fall back to
    // parseAiIntro on the full text (single-item, no prefix).
    const matches = [...text.matchAll(/## 项目 (\d+)\n([\s\S]*?)(?=## 项目 \d+|$)/g)];
    const hasPrefixes = matches.length > 0;

    return items.map((item, i) => {
      const section = hasPrefixes
        ? (matches.find((m) => Number(m[1]) === i + 1)?.[2] ?? '')
        : text;
      const aiIntro = parseAiIntro(section);
      return { ...item, ai_intro: aiIntro || undefined };
    });
  } catch (err) {
    console.error('summarizeReadmes LLM call failed:', err);
    return items.map((item) => ({ ...item, ai_intro: undefined }));
  }
}
