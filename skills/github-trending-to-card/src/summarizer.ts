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

<b>解决问题：</b>该项目的核心问题或痛点，一句话概括。

<b>解决方案：</b>该项目的核心实现思路或方法，一句话概括。

规则：
- 使用 <b> 标签包裹每一行（包含标题和内容），不要在 <b> 标签外放置任何内容
- 正确格式：<b>解决问题：</b>内容<br><b>解决方案：</b>内容
- 禁止格式：<b>解决问题：</b>内容文字（后面无闭合标签，内容直接跟在外面）
- 总字数控制在 70-150 字
- 不得添加 README 中不存在的虚构信息`;

function buildSummaryUserMessage(item: TrendingItem, readme: string): string {
  return SUMMARY_USER_PROMPT
    .replace('{owner}', item.owner)
    .replace('{name}', item.name)
    .replace('{description}', item.description || '无')
    .replace('{readme}', readme || '（README 不可用）');
}

function parseAiIntro(text: string): string {
  // Match: <b>解决问题：</b>...(optional <br> or whitespace)...<b>解决方案：</b>...
  const match = text.match(
    /<b>解决问题：<\/b>(?:<br\s*\/?\/?\s*>|\s)*[\s\S]*?<b>解决方案：<\/b>(?:<br\s*\/?\/?\s*>|\s)*[\s\S]*/,
  );
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

  const availableCount = readmes.filter((r) => r.length > 0).length;
  console.log(`summarizeReadmes: ${availableCount}/${items.length} READMEs available`);
  if (availableCount < items.length / 2) {
    console.warn(
      `summarizeReadmes: only ${availableCount}/${items.length} READMEs available — skipping AI intro`,
    );
    return items.map((item) => ({ ...item, ai_intro: undefined }));
  }

  const model = process.env.LLM_MODEL || 'Qwen/Qwen2.5-72B-Instruct';
  const client = clientFactory();

  // Process sequentially — batching all 10 items in one LLM call causes
  // the model to ignore projects beyond the first (context overflow / lost-in-middle).
  const results: (string | undefined)[] = new Array(items.length);

  for (let i = 0; i < items.length; i++) {
    const userMsg = buildSummaryUserMessage(items[i], readmes[i]);
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        max_tokens: 512,
      });
      const text = response.choices[0]?.message?.content || '';
      const aiIntro = parseAiIntro(text);
      results[i] = aiIntro || undefined;
    } catch (err) {
      console.warn(
        `summarizeReadmes: LLM call failed for item ${i + 1} (${items[i].owner}/${items[i].name}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      results[i] = undefined;
    }
  }

  console.log(
    `summarizeReadmes: ${results.filter(Boolean).length}/${items.length} AI intros generated`,
  );

  return items.map((item, i) => ({
    ...item,
    ai_intro: results[i],
  }));
}
