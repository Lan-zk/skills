import * as fs from 'fs';
import * as path from 'path';
import type { TrendingItem } from './types';

/**
 * Converts AI intro HTML tags to Markdown-compatible formatting.
 * <b>...</b> → **...**
 * <br>     → \n
 */
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return html
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<br\s*\/?\/?>/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Generates a markdown file for a single trending repository.
 * Returns the absolute file path.
 */
export function generateMarkdownFile(
  item: TrendingItem,
  outputDir: string,
): string {
  const safeName = item.name.replace(/[/\\?%*:|"<>]/g, '-');
  const fileName = `${safeName}.md`;
  const filePath = path.resolve(outputDir, fileName);

  const repoUrl = `https://github.com/${item.owner}/${item.name}`;
  const aiIntroMd = item.ai_intro ? htmlToMarkdown(item.ai_intro) : '_（暂无 AI 解析）_';

  const content = [
    `# ${item.owner}/${item.name}`,
    '',
    `## 项目地址`,
    repoUrl,
    '',
    `## 项目简介`,
    item.description || '_（暂无描述）_',
    '',
    `## AI 解析`,
    aiIntroMd,
    '',
    `## 基本信息`,
    '',
    `| 字段 | 值 |`,
    `|------|----|`,
    `| 语言 | ${item.language || '_未知_'} |`,
    `| ⭐ Stars | ${item.stars} |`,
    `| 📈 今日新增 | ${item.new_stars} |`,
    `| 🍴 Forks | ${item.forks} |`,
    `| 👥 贡献者 | ${item.contributors} |`,
    `| 📜 许可证 | ${item.license || '_无_'} |`,
    `| 🕐 抓取时间 | ${item.timestamp} |`,
    '',
  ].join('\n');

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Generates one markdown file per trending item, placed in outputDir.
 * Returns the list of absolute file paths.
 */
export function writeMarkdownFiles(
  items: TrendingItem[],
  outputDir: string,
): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  return items.map((item) => generateMarkdownFile(item, outputDir));
}
