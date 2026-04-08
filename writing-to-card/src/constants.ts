/** 画布尺寸 */
export const CANVAS = {
  WIDTH: 1080,
  HEIGHT: 1440,
} as const;

/** 视口配置（deviceScaleFactor: 2 → 渲染 2160×2880 视网膜分辨率） */
export const VIEWPORT = {
  width: CANVAS.WIDTH,
  height: CANVAS.HEIGHT,
  deviceScaleFactor: 2,
} as const;

/** 排版常量 */
export const LAYOUT = {
  /** 左右留白 px */
  paddingX: 120,
  /** 正文字号 px */
  fontSize: 44,
  /** 行高倍数 */
  lineHeight: 1.8,
  /** 单行高度 px（字号 × 行高，向上取整到整px） */
  linePx: Math.ceil(44 * 1.8),
  /** 段落间距 px */
  paragraphGap: 40,
  /** 顶部内容区起始位置 px */
  contentTop: 80,
  /** 底部署名区高度 px */
  footerHeight: 100,
} as const;

/** 有效阅读宽度 px */
export const CONTENT_WIDTH = CANVAS.WIDTH - LAYOUT.paddingX * 2;

/** 可用内容区高度 px */
export const CONTENT_HEIGHT = CANVAS.HEIGHT - LAYOUT.contentTop - LAYOUT.footerHeight;

/** 字体 */
export const FONT = {
  family: '"Songti SC", "SimSun", "Times New Roman", serif',
} as const;

/** 颜色 */
export const COLORS = {
  background: '#faf9f7',
  text: '#1a1a1a',
  accent: '#e8453c',
  subtitle: '#666666',
  rule: '#d4cfc7',
} as const;

/** 字号 */
export const FONT_SIZES = {
  coverTitle: 120,
  subtitle: 36,
  h1: 72,
  h2: 56,
  body: LAYOUT.fontSize,
  footer: 22,
} as const;

/**
 * 估算单页最大可容纳字符数
 *
 * 计算逻辑：
 * - 可用内容高度 = 1440 - 80(顶部) - 100(底部署名) = 1260px
 * - 每行高度 = 44 × 1.8 = 80px
 * - 可排布行数 = 1260 / 80 ≈ 15 行
 * - 每行有效字数 = 840px / 44px ≈ 19 字（中文字符）
 * - 单页容量 ≈ 15 × 19 = 285 字，安全值取 280
 */
export const CHARS_PER_PAGE = 280;

/** 图片最大宽度（等于有效阅读宽度） */
export const IMAGE_MAX_WIDTH = CONTENT_WIDTH;
