---
name: writing-to-card
description: 将长篇 Markdown 文章转换为多张 1080×1440 PNG 图片，适合小红书发布。当用户需要将文章、博客、教程转成分享图片时使用。
---

# Writing to Card

## Description

将 Markdown 长文自动转换为符合小红书排版规范的 PNG 图片序列（封面 + 多页正文）。支持加粗、斜体、标题、列表、引用块、本地图片等常用语法，自动分页并渲染高质量截图。

## When to Use

- 用户提供文章内容，希望生成分享图片
- 用户提到"转成小红书卡片"、"生成分享图片"、"文章转图片"

## Usage

导入并调用 `executeSkill`：

```typescript
import { executeSkill } from './dist/index';

const result = await executeSkill({
  title: '文章标题',
  subtitle: '副标题（可选）',
  content: 'Markdown 字符串或文件路径',
  contentBaseDir: '/abs/path/to/content/dir',  // 可选，用于解析相对图片路径
  outputDir: './output/',
});
// result.files: ['./output/01_cover.png', './output/02_content.png', ...]
```

## Workflow

### 阶段一：输入解析

1. 接收用户传入的 `title`、`subtitle`（可选）、`content`
2. 若 `content` 为文件路径，读取文件内容；若为 Markdown 字符串，直接使用
3. 解析正文中的本地图片相对路径（基于 `contentBaseDir` 或文件所在目录）

### 阶段二：分页切割

4. 使用 `markdown-it` 将 Markdown 解析为 Token 树
5. 按字符数（每页 280 字）遍历 Token，累加字符数
6. 达到容量上限时，在 Token 边界处切分页面
7. 若切分点在复合标签（加粗/斜体/代码块）内部，自动补全闭合标签

### 阶段三：渲染截图

8. 封面：加载 `templates/cover.hbs`，注入标题、副标题（可选）、日期、署名，渲染截图
9. 正文每页：加载 `templates/content.hbs`，注入 HTML 内容片段、日期、署名，渲染截图
10. 使用 Playwright，viewport 1080×1440，deviceScaleFactor: 2

### 阶段四：文件输出

11. 按顺序写入输出目录：`01_cover.png`, `02_content.png`, `03_content.png` ...
12. 返回文件路径数组

## Templates

模板文件位于 `templates/` 目录（MVP 一套默认模板）：

- `cover.hbs`：封面模板，变量：`title`, `subtitle?`, `date`, `author`
- `content.hbs`：正文模板，变量：`content`（HTML 片段）, `date`, `author`

## Error Handling

- 输入文件不存在：抛出 `Error: Content file not found`
- 输出目录写入失败：抛出文件系统错误

## Reference

详细设计文档：`docs/superpowers/specs/2026-04-08-writing-to-card-design.md`
