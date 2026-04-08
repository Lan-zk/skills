export interface SkillInput {
  /** 封面主标题 */
  title: string;
  /** 封面副标题（可选） */
  subtitle?: string;
  /** 正文 Markdown 内容（字符串或文件路径） */
  content: string;
  /** 输入 Markdown 文件所在目录，用于解析相对图片路径 */
  contentBaseDir?: string;
  /** 模板名称（暂未实现多模板，固定 default） */
  template?: string;
  /** 输出目录 */
  outputDir: string;
}

export interface SkillOutput {
  /** 生成的图片文件路径数组，按顺序排列 */
  files: string[];
}

/** markdown-it Token 标准化接口 */
export interface Token {
  type: string;
  tag: string;
  content: string;
  children: Token[] | null;
  map: [number, number] | null;
  info: string;
  markup: string;
  meta: Record<string, unknown>;
  /** markdown-it 原始属性数组: [['src', '...'], ['alt', '...']] */
  attr?: [string, string][];
}

/**
 * 获取 token 上指定属性的值
 */
export function tokenAttr(token: Token, name: string): string | undefined {
  if (!token.attr) return undefined;
  const attr = token.attr.find(([k]) => k === name);
  return attr ? attr[1] : undefined;
}
