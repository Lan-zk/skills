import type { SkillInput, SkillOutput, RenderOptions } from './types.js';
import { DEFAULT_OPTIONS } from './types.js';
import { loadMarkdownFile } from './file-loader.js';
import { parseMarkdown, extractTitle, extractPreviewText } from './parser.js';
import { createBrowserManager, closeBrowserManager, closeBrowser } from './browser-manager.js';
import { Paginator } from './paginator.js';
import { HtmlRenderer } from './html-renderer.js';
import { Screenshot } from './screenshot.js';
import { FileWriter } from './file-writer.js';

/**
 * 执行 md2card 转换
 */
export async function executeSkill(input: SkillInput): Promise<SkillOutput> {
  const options: RenderOptions = {
    input: input.input,
    outputDir: input.outputDir,
    ...DEFAULT_OPTIONS,
    ...input.options,
  };

  // 1. 读取 Markdown 文件
  const { content, baseDir, fileName } = loadMarkdownFile(options.input);

  // 2. 解析 Markdown
  const document = parseMarkdown(content, fileName, baseDir);

  // 3. 提取封面标题
  const title = extractTitle(document);

  // 4. 提取封面预览文本（前几段正文）
  const preview = extractPreviewText(document, options.theme);

  // 5. 创建浏览器管理器
  const manager = await createBrowserManager(options.pageWidth, options.pageHeight);

  try {
    // 6. 初始化分页器
    const paginator = new Paginator(manager.page, options);
    await paginator.init();

    // 7. 执行分页
    const pages = await paginator.paginate(document, options.cover);

    // 8. 清理分页器
    await paginator.cleanup();

    // 9. 创建 HTML 渲染器
    const renderer = new HtmlRenderer(options);

    // 10. 创建截图器
    const screenshot = new Screenshot(manager, options);

    // 11. 创建文件写入器
    const writer = new FileWriter(options.outputDir);

    // 12. 渲染封面
    const files: string[] = [];
    if (options.cover && pages.length > 0) {
      const coverHtml = renderer.renderCover(title, preview);
      const coverBuffer = await screenshot.capture(coverHtml);
      const coverPath = writer.writeCover(coverBuffer);
      files.push(coverPath);
    }

    // 13. 渲染内容页
    let pageIndex = 1;
    for (const pageModel of pages) {
      const pageHtml = renderer.renderPage(pageModel, title);
      const pageBuffer = await screenshot.capture(pageHtml);
      const pagePath = writer.writePage(pageBuffer, pageIndex);
      files.push(pagePath);
      pageIndex++;
    }

    return { files };

  } finally {
    // 14. 关闭浏览器
    await closeBrowserManager(manager);
    await closeBrowser();
  }
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: md2card <input.md> <outputDir> [options]');
    console.error('Options:');
    console.error('  --cover <true|false>  Enable/disable cover page (default: true)');
    console.error('  --theme <name>        Theme: apple, claude, default (default: apple)');
    console.error('  --width <number>       Page width (default: 1242)');
    console.error('  --height <number>      Page height (default: 1660)');
    console.error('');
    console.error('Examples:');
    console.error('  md2card article.md ./dist --theme apple');
    console.error('  md2card article.md ./dist --theme claude');
    console.error('  md2card article.md ./dist --theme default --cover false');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputDir = args[1];
  const options: SkillInput['options'] = {};

  // 解析选项
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--cover' && args[i + 1]) {
      options.cover = args[++i] === 'true';
    } else if (args[i] === '--theme' && args[i + 1]) {
      options.theme = args[++i];
    } else if (args[i] === '--width' && args[i + 1]) {
      options.pageWidth = parseInt(args[++i], 10);
    } else if (args[i] === '--height' && args[i + 1]) {
      options.pageHeight = parseInt(args[++i], 10);
    }
  }

  executeSkill({ input: inputPath, outputDir, options })
    .then(result => {
      console.log('Generated files:');
      result.files.forEach(f => console.log(`  ${f}`));
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
