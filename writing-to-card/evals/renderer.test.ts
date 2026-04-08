import * as fs from 'fs';
import * as path from 'path';
import { executeSkill } from '../src/index';

const tmpDir = path.join(__dirname, '..', 'tmp', 'output');

describe('executeSkill integration', () => {
  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up generated PNG files
    if (fs.existsSync(tmpDir)) {
      const files = fs.readdirSync(tmpDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          fs.unlinkSync(path.join(tmpDir, file));
        }
      }
    }
    // Close browser
    const { closeBrowser } = await import('../src/renderer');
    await closeBrowser();
  });

  it('should generate at least 2 files (cover + content) for short content', async () => {
    const result = await executeSkill({
      title: '测试标题',
      subtitle: '测试副标题',
      content: '这是一段正文内容，用于验证渲染管线是否正常工作。',
      outputDir: tmpDir,
    });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    expect(result.files[0]).toContain('01_cover.png');
    expect(result.files[1]).toContain('02_content.png');
  });

  it('should generate PNG files with valid size', async () => {
    const result = await executeSkill({
      title: '图片测试',
      content: '## 标题\n\n正文段落。\n\n- 列表项一\n- 列表项二',
      outputDir: tmpDir,
    });

    for (const filePath of result.files) {
      const stats = fs.statSync(filePath);
      // PNG should be larger than 10KB
      expect(stats.size).toBeGreaterThan(10000);
    }
  });

  it('should handle content without subtitle', async () => {
    const result = await executeSkill({
      title: '无副标题测试',
      content: '正文内容，无副标题。',
      outputDir: tmpDir,
    });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    expect(result.files[0]).toContain('01_cover.png');
  });

  it('should handle Markdown with bold, italic, and code', async () => {
    const result = await executeSkill({
      title: '格式测试',
      content: '普通文字**加粗**和*斜体*和`代码`。',
      outputDir: tmpDir,
    });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle file path input', async () => {
    const inputFile = path.join(__dirname, '..', 'tmp', 'test-article.md');
    const content = '# 文章标题\n\n这是一篇测试文章正文。';
    fs.writeFileSync(inputFile, content, 'utf-8');

    const result = await executeSkill({
      title: '文件输入测试',
      content: inputFile,
      outputDir: tmpDir,
    });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    fs.unlinkSync(inputFile);
  });
});
