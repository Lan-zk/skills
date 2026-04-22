import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LoadResult {
  content: string;
  baseDir: string;
  fileName: string;
}

/**
 * 读取 Markdown 文件并返回内容、基础目录和文件名
 */
export function loadMarkdownFile(filePath: string): LoadResult {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Markdown file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const baseDir = path.dirname(absolutePath);
  const fileName = path.basename(absolutePath, path.extname(absolutePath));

  return { content, baseDir, fileName };
}

/**
 * 解析相对图片路径为绝对 file:// URL
 */
export function resolveImagePath(relativePath: string, baseDir: string): string {
  const absolutePath = path.resolve(baseDir, relativePath);
  return `file://${absolutePath.replace(/\\/g, '/')}`;
}

/**
 * 检查图片文件是否存在
 */
export function imageExists(imagePath: string): boolean {
  // Remove file:// prefix if present
  const filePath = imagePath.replace(/^file:\/\//, '');
  return fs.existsSync(filePath);
}
