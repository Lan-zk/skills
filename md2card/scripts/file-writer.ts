import * as fs from 'fs';
import * as path from 'path';

export class FileWriter {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 写入封面 PNG
   */
  writeCover(buffer: Buffer): string {
    const filePath = path.join(this.outputDir, 'cover.png');
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  /**
   * 写入内容页 PNG
   */
  writePage(buffer: Buffer, pageNumber: number): string {
    const fileName = `page-${String(pageNumber).padStart(3, '0')}.png`;
    const filePath = path.join(this.outputDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  /**
   * 获取输出目录
   */
  getOutputDir(): string {
    return this.outputDir;
  }
}
