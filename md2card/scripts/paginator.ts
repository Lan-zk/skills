import type { Page } from 'playwright';
import type { DocumentModel, PageModel, PageItem, Block, Fragment, RenderOptions, Inline } from './types.js';
import { Measurer } from './measurer.js';

export class Paginator {
  private measurer: Measurer;
  private contentHeight: number;

  constructor(page: Page, options: RenderOptions) {
    this.measurer = new Measurer(page, options);
    this.contentHeight = options.pageHeight - options.paddingTop - options.paddingBottom;
  }

  async init(): Promise<void> {
    await this.measurer.init();
  }

  async cleanup(): Promise<void> {
    await this.measurer.cleanup();
  }

  /**
   * 对文档进行分页
   */
  async paginate(document: DocumentModel, enableCover: boolean): Promise<PageModel[]> {
    const pages: PageModel[] = [];
    let currentPage = this.createEmptyPage(0);
    let remainingHeight = this.contentHeight;

    let blockIndex = 0;
    while (blockIndex < document.blocks.length) {
      const block = document.blocks[blockIndex];

      // 测量完整 block 高度
      const fullHeight = await this.measurer.measureBlock(block);

      // 检查是否能放入当前页
      if (fullHeight <= remainingHeight) {
        // 完整放入
        currentPage.items.push({
          blockType: block.type,
          fragment: this.blockToFragment(block),
        });
        remainingHeight -= fullHeight;
        blockIndex++;
        continue;
      }

      // 完整 block 放不下
      if (!this.isSplittable(block)) {
        // 不可拆分：移到下一页
        if (currentPage.items.length > 0) {
          pages.push(currentPage);
        }
        currentPage = this.createEmptyPage(pages.length);
        remainingHeight = this.contentHeight;
        continue;
      }

      // 可拆分 block
      const isPageStart = currentPage.items.length === 0;
      const result = await this.splitBlock(block, remainingHeight, isPageStart);

      if (result.current) {
        // 有部分内容可以放入当前页
        currentPage.items.push({
          blockType: block.type,
          fragment: result.current,
        });
        pages.push(currentPage);
        currentPage = this.createEmptyPage(pages.length);
        remainingHeight = this.contentHeight;

        if (result.rest) {
          // 有剩余内容，继续处理（不前进 blockIndex）
          document.blocks[blockIndex] = this.fragmentToBlock(block.type, result.rest);
          continue;
        }
      } else {
        // 无法拆分到当前页，整个 block 移到下一页
        if (currentPage.items.length > 0) {
          pages.push(currentPage);
        }
        currentPage = this.createEmptyPage(pages.length);
        remainingHeight = this.contentHeight;
        // 不前进 blockIndex，在下一页重新尝试
        continue;
      }

      blockIndex++;
    }

    if (currentPage.items.length > 0) {
      pages.push(currentPage);
    }

    // 如果启用封面，在第一页添加封面标记
    if (enableCover && pages.length > 0) {
      pages[0] = { ...pages[0], isCover: true };
    }

    return pages;
  }

  private async splitBlock(
    block: Block,
    maxHeight: number,
    isPageStart: boolean
  ): Promise<{ current: Fragment | null; rest: Fragment | null }> {
    switch (block.type) {
      case 'paragraph': {
        // 标题规则 H-2, H-3: 检查是否需要最小跟随内容
        if (this.requiresMinimumFollowing(block, maxHeight, isPageStart)) {
          return { current: null, rest: this.blockToFragment(block) };
        }
        const result = await this.measurer.findMaxFragment(block.inlines, maxHeight);
        const fitFragment = result.fit as { type: 'paragraph'; inlines: Inline[] };
        return {
          current: { type: 'paragraph', inlines: fitFragment.inlines },
          rest: { type: 'paragraph', inlines: result.rest } as unknown as Fragment
        };
      }
      case 'code': {
        const result = await this.measurer.splitCodeByLines(block, maxHeight);
        return {
          current: result.fit,
          rest: { type: 'paragraph', inlines: result.rest } as unknown as Fragment
        };
      }
      case 'blockquote':
        // 引用块拆分：按内部段落处理
        return this.splitQuote(block, maxHeight);
      case 'list':
        // 列表拆分：按 item 处理
        return this.splitList(block, maxHeight);
      default:
        return { current: null, rest: null };
    }
  }

  private requiresMinimumFollowing(
    block: Block,
    maxHeight: number,
    isPageStart: boolean
  ): boolean {
    if (!isPageStart || block.type !== 'heading') return false;
    return true; // 标题后需要跟随内容
  }

  private async splitQuote(
    block: { type: 'blockquote'; blocks: Block[] },
    maxHeight: number
  ): Promise<{ current: Fragment | null; rest: Fragment | null }> {
    // 简化实现：整个引用块移到下一页
    return { current: null, rest: this.blockToFragment(block) };
  }

  private async splitList(
    block: Block,
    maxHeight: number
  ): Promise<{ current: Fragment | null; rest: Fragment | null }> {
    if (block.type !== 'list') return { current: null, rest: null };

    // 简化实现：整个列表移到下一页
    return { current: null, rest: this.blockToFragment(block) };
  }

  private isSplittable(block: Block): boolean {
    return ['paragraph', 'code', 'blockquote', 'list'].includes(block.type);
  }

  private blockToFragment(block: Block): Fragment {
    switch (block.type) {
      case 'heading':
        return { type: 'heading', level: block.level, inlines: block.inlines };
      case 'paragraph':
        return { type: 'paragraph', inlines: block.inlines };
      case 'list':
        return { type: 'list', ordered: block.ordered, start: block.start, items: block.items };
      case 'blockquote':
        return { type: 'blockquote', blocks: block.blocks };
      case 'hr':
        return { type: 'hr' };
      case 'image':
        return { type: 'image', src: block.src, alt: block.alt, title: block.title };
      case 'code':
        return { type: 'code', language: block.language, value: block.value };
    }
  }

  private fragmentToBlock(type: string, fragment: Fragment): Block {
    switch (type) {
      case 'paragraph':
        return { type: 'paragraph', inlines: (fragment as { inlines: Inline[] }).inlines };
      case 'code':
        return { type: 'code', language: (fragment as { language?: string }).language, value: (fragment as { value: string }).value };
      default:
        return { type: 'paragraph', inlines: [{ type: 'text', value: '' }] };
    }
  }

  private createEmptyPage(index: number): PageModel {
    return { index: index + 1, isCover: false, items: [] };
  }
}
