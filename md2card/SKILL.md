---
name: md2card
description: 将 Markdown 文件分页渲染为 PNG 图片卡片。当用户需要将 Markdown 文章转换为分页图片时使用。
---

# MD to Card

将 Markdown 文件转换为分页 PNG 图片，适合长文分享。

## When to Use

- 用户提供 Markdown 文件路径，希望生成分享图片
- 用户提到"Markdown 转图片"、"文章转卡片"、"生成分页图"

## Workflow

### 阶段一：文件读取与解析

1. 接收输入的 Markdown 文件路径
2. 读取文件内容，UTF-8 编码
3. 解析图片相对路径（基于文件所在目录）
4. 使用 `remark` 将 Markdown 解析为 AST

### 阶段二：标准化为 DocumentModel

5. 将 Remark AST 转换为 DocumentModel
6. 支持的 Block 类型：heading, paragraph, list, blockquote, hr, image, code
7. 行内元素：text, strong, emphasis, inlineCode

### 阶段三：浏览器测量初始化

8. 启动 Playwright 浏览器实例
9. 创建隐藏的测量容器 DOM
10. 设置正确的视口尺寸 (1242×1660)
11. 加载正文样式（字体、行高、颜色）

### 阶段四：分页计算

12. 遍历 DocumentModel.blocks
13. 对每个 block：
    - 使用 measurer 测量完整高度
    - 若可放入当前页，加入
    - 若不可，放入下一页
    - 若需要拆分（paragraph、code），使用二分查找找到最大可容纳 fragment
14. 产出 PageModel[]

### 阶段五：逐页渲染截图

15. 封面渲染（可选）：
    - 使用文档第一个 h1 作为标题
    - 若无 h1，使用文件名
    - 使用 `templates/cover.hbs`
16. 正文每页：
    - 使用 `templates/page.hbs`
    - 渲染 HTML
    - Playwright 截图

### 阶段六：文件输出

17. 输出目录创建（如不存在）
18. 写入 `cover.png`（如启用）
19. 依次写入 `page-001.png`, `page-002.png`, ...

## 配置选项

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `cover` | `true` | 是否生成封面 |
| `pageWidth` | `1242` | 页面宽度 |
| `pageHeight` | `1660` | 页面高度 |
| `paddingTop` | `96` | 上边距 |
| `paddingRight` | `88` | 右边距 |
| `paddingBottom` | `96` | 下边距 |
| `paddingLeft` | `88` | 左边距 |
| `fontFamily` | `sans-serif` | 正文字体 |
| `baseFontSize` | `36` | 基础字号 |
| `lineHeight` | `1.6` | 行高 |
| `codeFontFamily` | `monospace` | 代码字体 |
| `codeFontSize` | `28` | 代码字号 |

## 分页规则

详见 `references/pagination-rules.md`：

- **标题规则 H-1~H-4**：标题不可跨页，需最小跟随内容
- **段落规则 P-1~P-4**：段落允许跨页，保持样式正确
- **列表规则 L-1~L-5**：按 item 分页，有序列表编号连续
- **引用规则 Q-1~Q-3**：允许跨页，每页独立完整容器
- **分隔线规则 R-1~R-3**：不可跨页，尽量不单独在页首
- **图片规则 I-1~I-6**：不可拆分，等比缩放
- **代码块规则 C-1~C-5**：按行拆分，不截断行

## 支持的 Markdown 元素

### 必须支持
- [x] 标题 h1/h2/h3
- [x] 段落
- [x] 粗体 `**text**`
- [x] 斜体 `*text*`
- [x] 行内代码 `` `code` ``
- [x] 无序列表
- [x] 有序列表
- [x] 引用块
- [x] 分隔线 `---`
- [x] 图片（含相对路径）
- [x] 代码块

### 不支持（降级处理）
- [ ] 表格 → 显示 `[Table not supported]`
- [ ] 数学公式 → 显示 `[Math not supported]`
- [ ] HTML 标签 → 转普通文本
- [ ] Mermaid → 显示 `[Diagram not supported]`
- [ ] 脚注
- [ ] 任务列表

## CLI 用法

```bash
md2card <input.md> <outputDir> [options]

# 示例
md2card ./article.md ./dist
md2card ./article.md ./dist --cover false
md2card ./article.md ./dist --width 1080 --height 1440
```

## API 用法

```typescript
import { executeSkill } from './scripts/index.js';

const result = await executeSkill({
  input: './article.md',
  outputDir: './dist',
  options: {
    cover: true,
    pageWidth: 1242,
    pageHeight: 1660,
  }
});

console.log(result.files);
// ['./dist/cover.png', './dist/page-001.png', ...]
```

## Error Handling

- 输入文件不存在：抛出错误
- 图片读取失败：显示占位符，不崩溃
- Playwright 启动失败：抛出错误

## References

- [分页规则详解](references/pagination-rules.md)
- [Block 类型定义](references/block-types.md)
- [浏览器测量策略](references/measurement-strategy.md)

## Test Fixtures

- [data/test-fixtures/simple.md](data/test-fixtures/simple.md) - 简单单页测试
- [data/test-fixtures/long-paragraph.md](data/test-fixtures/long-paragraph.md) - 长段落分页测试
- [data/test-fixtures/all-elements.md](data/test-fixtures/all-elements.md) - 所有元素综合测试
- [data/test-fixtures/with-code.md](data/test-fixtures/with-code.md) - 代码块测试
