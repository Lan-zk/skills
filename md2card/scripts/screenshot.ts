import type { BrowserManager } from './browser-manager.js';
import type { RenderOptions } from './types.js';

export class Screenshot {
  private manager: BrowserManager;
  private options: RenderOptions;

  constructor(manager: BrowserManager, options: RenderOptions) {
    this.manager = manager;
    this.options = options;
  }

  /**
   * 渲染 HTML 并截图
   */
  async capture(html: string): Promise<Buffer> {
    const { page } = this.manager;

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(100); // 等待字体加载

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    return buffer;
  }

  /**
   * 渲染并返回 base64 编码的图片
   */
  async captureBase64(html: string): Promise<string> {
    const buffer = await this.capture(html);
    return buffer.toString('base64');
  }
}
