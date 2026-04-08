import * as fs from 'fs';
import * as path from 'path';
import { SkillInput, SkillOutput } from './types';
import { parseToTokens, resolveImagePaths } from './parser';
import { splitTokensToPages } from './splitter';
import { renderCover, renderContent, closeBrowser } from './renderer';

/** 固定署名 */
const DEFAULT_AUTHOR = '写作卡片';

/**
 * 格式化当前日期为 YYYY-MM-DD
 */
function formatDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 生成文件名，如 "01_cover.png", "02_content.png"
 */
function makeFileName(index: number, type: 'cover' | 'content'): string {
  const idx = String(index).padStart(2, '0');
  return `${idx}_${type}.png`;
}

/**
 * 将 Base64 PNG 字符串写入文件
 */
function writePngFile(outputDir: string, fileName: string, base64: string): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, fileName);
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * 执行 Markdown → PNG 卡片转换
 *
 * @param input - Skill 输入参数
 * @returns 生成的图片文件路径数组
 */
export async function executeSkill(input: SkillInput): Promise<SkillOutput> {
  const {
    title,
    subtitle,
    content: contentInput,
    contentBaseDir,
    outputDir,
  } = input;

  const date = formatDate();
  const author = DEFAULT_AUTHOR;

  let files: string[] = [];

  try {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ── 解析正文内容 ──────────────────────────────────────────────────────────
    let markdownContent: string;
    let baseDir: string;

    if (fs.existsSync(contentInput)) {
      // content 是文件路径，读取文件
      const absolutePath = path.resolve(contentInput);
      baseDir = contentBaseDir ?? path.dirname(absolutePath);
      markdownContent = fs.readFileSync(absolutePath, 'utf-8');
    } else {
      // content 是直接的 Markdown 字符串
      baseDir = contentBaseDir ?? process.cwd();
      markdownContent = contentInput;
    }

    // 修正图片相对路径
    markdownContent = resolveImagePaths(markdownContent, baseDir);

    let pageIndex = 1;

    // ── 渲染封面 ──────────────────────────────────────────────────────────────
    const coverBase64 = await renderCover({ title, subtitle, date, author });
    const coverFileName = makeFileName(pageIndex, 'cover');
    const coverPath = writePngFile(outputDir, coverFileName, coverBase64);
    files.push(coverPath);
    pageIndex++;

    // ── 解析并分页正文 ────────────────────────────────────────────────────────
    const tokens = parseToTokens(markdownContent);
    const pageHtmls = splitTokensToPages(tokens);

    for (const pageHtml of pageHtmls) {
      const contentBase64 = await renderContent({ content: pageHtml, date, author });
      const contentFileName = makeFileName(pageIndex, 'content');
      const contentPath = writePngFile(outputDir, contentFileName, contentBase64);
      files.push(contentPath);
      pageIndex++;
    }
  } finally {
    await closeBrowser();
  }

  return { files };
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});
