// ─── Inline Types ─────────────────────────────────────────────────────────────

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'emphasis'; children: Inline[] }
  | { type: 'inlineCode'; value: string };

// ─── Block Types ───────────────────────────────────────────────────────────────

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  inlines: Inline[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  inlines: Inline[];
}

export interface ListItemBlock {
  blocks: Array<ParagraphBlock | CodeBlock | ImageBlock | QuoteBlock>;
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  start?: number;
  items: ListItemBlock[];
}

export interface QuoteBlock {
  type: 'blockquote';
  blocks: Block[];
}

export interface HrBlock {
  type: 'hr';
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt?: string;
  title?: string;
}

export interface CodeBlock {
  type: 'code';
  language?: string;
  value: string;
}

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | HrBlock
  | ImageBlock
  | CodeBlock;

// ─── Document Model ───────────────────────────────────────────────────────────

export interface DocumentModel {
  title: string;
  blocks: Block[];
  baseDir: string;
}

// ─── Fragment Types ──────────────────────────────────────────────────────────

export interface HeadingFragment {
  type: 'heading';
  level: 1 | 2 | 3;
  inlines: Inline[];
}

export interface ParagraphFragment {
  type: 'paragraph';
  inlines: Inline[];
}

export interface ListFragment {
  type: 'list';
  ordered: boolean;
  start?: number;
  items: ListItemBlock[];
}

export interface QuoteFragment {
  type: 'blockquote';
  blocks: Block[];
}

export interface HrFragment {
  type: 'hr';
}

export interface ImageFragment {
  type: 'image';
  src: string;
  alt?: string;
  title?: string;
  error?: boolean;
}

export interface CodeFragment {
  type: 'code';
  language?: string;
  value: string;
}

export type Fragment =
  | HeadingFragment
  | ParagraphFragment
  | ListFragment
  | QuoteFragment
  | HrFragment
  | ImageFragment
  | CodeFragment;

// ─── Page Model ───────────────────────────────────────────────────────────────

export interface PageItem {
  blockType: Block['type'];
  fragment: Fragment;
}

export interface PageModel {
  index: number;
  isCover: boolean;
  items: PageItem[];
}

// ─── Render Options ───────────────────────────────────────────────────────────

export interface ThemeConfig {
  name: string;
  // 页面背景
  backgroundColor: string;
  backgroundGradient?: string;
  // 文本颜色
  titleColor: string;
  bodyColor: string;
  secondaryColor: string;
  // 强调色
  accentColor: string;
  // 标题样式
  titleFontFamily: string;
  titleFontSize: number;
  titleFontWeight: number;
  // 正文样式
  bodyFontFamily: string;
  bodyFontSize: number;
  bodyLineHeight: number;
  // 代码样式
  codeBackground: string;
  codeColor: string;
  codeFontFamily?: string;
  codeFontSize?: number;
  // 引用样式
  blockquoteBorder: string;
  blockquoteBackground: string;
  blockquoteColor: string;
  // 分割线
  hrColor: string;
  // 卡片背景
  cardBackground: string;
  cardShadow?: string;
  // 页眉页脚
  headerEnabled: boolean;
  footerEnabled: boolean;
  headerHeight: number;
  footerHeight: number;
  // 封面预览
  coverPreviewLines: number;
}

export interface RenderOptions {
  input: string;
  outputDir: string;
  pageWidth: number;
  pageHeight: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  theme: string;
  cover: boolean;
  fontFamily: string;
  baseFontSize: number;
  lineHeight: number;
  codeFontFamily: string;
  codeFontSize: number;
  imageMaxHeightRatio: number;
}

export const DEFAULT_OPTIONS: Omit<RenderOptions, 'input' | 'outputDir'> = {
  pageWidth: 1242,
  pageHeight: 1660,
  paddingTop: 96,
  paddingRight: 88,
  paddingBottom: 96,
  paddingLeft: 88,
  theme: 'apple',
  cover: true,
  fontFamily: 'sans-serif',
  baseFontSize: 36,
  lineHeight: 1.6,
  codeFontFamily: 'monospace',
  codeFontSize: 28,
  imageMaxHeightRatio: 0.8,
};

// 预设主题配置
export const THEMES: Record<string, ThemeConfig> = {
  apple: {
    name: 'apple',
    backgroundColor: '#ffffff',
    titleColor: '#1d1d1f',
    bodyColor: '#1d1d1f',
    secondaryColor: 'rgba(0, 0, 0, 0.48)',
    accentColor: '#0071e3',
    titleFontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, Helvetica Neue, sans-serif',
    titleFontSize: 56,
    titleFontWeight: 600,
    bodyFontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif',
    bodyFontSize: 17,
    bodyLineHeight: 1.47,
    codeBackground: '#f5f5f7',
    codeColor: '#1d1d1f',
    blockquoteBorder: '#1d1d1f',
    blockquoteBackground: '#f5f5f7',
    blockquoteColor: '#1d1d1f',
    hrColor: '#e0e0e0',
    cardBackground: '#f5f5f7',
    cardShadow: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
    headerEnabled: true,
    footerEnabled: true,
    headerHeight: 48,
    footerHeight: 48,
    coverPreviewLines: 8,
  },
  claude: {
    name: 'claude',
    backgroundColor: '#f5f4ed',
    titleColor: '#141413',
    bodyColor: '#4d4c48',
    secondaryColor: '#87867f',
    accentColor: '#c96442',
    titleFontFamily: 'Georgia, Cambria, Times New Roman, serif',
    titleFontSize: 52,
    titleFontWeight: 500,
    bodyFontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, Arial, sans-serif',
    bodyFontSize: 17,
    bodyLineHeight: 1.6,
    codeBackground: '#30302e',
    codeColor: '#faf9f5',
    blockquoteBorder: '#c96442',
    blockquoteBackground: 'rgba(201, 100, 66, 0.08)',
    blockquoteColor: '#5e5d59',
    hrColor: '#e8e6dc',
    cardBackground: '#faf9f5',
    cardShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 24px',
    headerEnabled: true,
    footerEnabled: true,
    headerHeight: 56,
    footerHeight: 56,
    coverPreviewLines: 10,
  },
  default: {
    name: 'default',
    backgroundColor: '#ffffff',
    titleColor: '#1a1a1a',
    bodyColor: '#333333',
    secondaryColor: '#666666',
    accentColor: '#0066cc',
    titleFontFamily: 'sans-serif',
    titleFontSize: 48,
    titleFontWeight: 700,
    bodyFontFamily: 'sans-serif',
    bodyFontSize: 36,
    bodyLineHeight: 1.6,
    codeBackground: '#f5f5f5',
    codeColor: '#333333',
    blockquoteBorder: '#e0e0e0',
    blockquoteBackground: '#f9f9f9',
    blockquoteColor: '#666666',
    hrColor: '#e0e0e0',
    cardBackground: '#ffffff',
    headerEnabled: false,
    footerEnabled: false,
    headerHeight: 0,
    footerHeight: 0,
    coverPreviewLines: 6,
  },
};

// ─── Skill Types ─────────────────────────────────────────────────────────────

export interface SkillInput {
  input: string;
  outputDir: string;
  options?: Partial<Omit<RenderOptions, 'input' | 'outputDir'>>;
}

export interface SkillOutput {
  files: string[];
}
