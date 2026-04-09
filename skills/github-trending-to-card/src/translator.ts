import { createLlmClient } from './llmClient';
import type { TrendingItem } from './types';

const TRANSLATION_SYSTEM_PROMPT = `# 角色
你是一位经验丰富的资深开发者与专业技术翻译，熟悉开源社区规范，精通各类技术栈（如 Java、Python、前端框架等）及行业术语。

# 任务
将我提供的 GitHub 项目简介（或 README 片段）准确、流畅地翻译成中文。

# 核心规则
1. **格式严格保留**：绝对保留原有的 Markdown 语法结构（包括各类标题、列表、加粗、链接、表格等），不要在翻译过程中破坏排版。
2. **代码与命令隔离**：严禁翻译代码块（\`\`\`...\`\`\`）、行内代码（\`...\`）、终端命令、文件路径、URL、环境变量以及类名/方法名/变量名。
3. **专业术语地道化**：
   - 保留行业通用英文术语不译（例如：API、UI、Token、Session、Hook、Bug 等）。
   - 将常规开发词汇翻译为中文开发者习以为常的表达（例如：Repository -> 仓库，Deploy -> 部署，Commit -> 提交，Middleware -> 中间件）。
4. **行文风格**：译文需严谨、专业、精炼，消除"机翻感"。在保证原意准确的基础上，调整语序以符合中文技术文档的阅读逻辑。`;

function buildTranslationUserMessage(items: TrendingItem[]): string {
  const list = items.map((item, i) => `${i + 1}. [${item.owner}/${item.name}] ${item.description}`).join('\n');
  return `# 输入原文\n${list}\n\n请严格按核心规则翻译以上项目简介，每行对应一条翻译，输出格式：\n1. <中文翻译>\n2. <中文翻译>`;
}

function parseTranslations(text: string, count: number): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const pattern = new RegExp(`^${i + 1}\\.?\\s+(.+)$`, 'm');
    const match = text.match(pattern);
    results.push(match ? match[1].trim() : '');
  }
  return results;
}

export async function translateDescriptions(
  items: TrendingItem[],
  clientFactory: () => ReturnType<typeof createLlmClient> = createLlmClient,
): Promise<TrendingItem[]> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    console.warn('LLM_API_KEY not set, skipping translation');
    return items;
  }

  if (items.length === 0) {
    return items;
  }

  const client = clientFactory();
  const model = process.env.LLM_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
      { role: 'user', content: buildTranslationUserMessage(items) },
    ],
    max_tokens: 1024,
  });

  const text = response.choices[0]?.message?.content || '';
  const translations = parseTranslations(text, items.length);

  return items.map((item, i) => ({
    ...item,
    description: translations[i] || item.description,
  }));
}
