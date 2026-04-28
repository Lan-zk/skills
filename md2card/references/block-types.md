# Block 类型定义与处理策略

---

## Block 类型列表

| 类型 | 可拆分 | 说明 |
|------|--------|------|
| `heading` | ❌ | 标题（H1/H2/H3） |
| `paragraph` | ✅ | 段落，按 inline 拆分 |
| `list` | ✅ | 列表，按 item 拆分 |
| `blockquote` | ✅ | 引用，按内部段落拆分 |
| `hr` | ❌ | 分隔线 |
| `image` | ❌ | 图片 |
| `code` | ✅ | 代码块，按行拆分 |

---

## HeadingBlock

```typescript
interface HeadingBlock {
  type: 'heading'
  level: 1 | 2 | 3
  inlines: Inline[]
}
```

**处理策略**：
- 不可拆分
- 标题后需要最小跟随内容（H-3）
- 标题不单独出现在页尾（H-4）

---

## ParagraphBlock

```typescript
interface ParagraphBlock {
  type: 'paragraph'
  inlines: Inline[]
}
```

**处理策略**：
- 可拆分，按 inline 二分查找
- 拆分时保持样式正确（P-4）
- 避免页尾只剩一小截（P-3）

---

## ListBlock

```typescript
interface ListBlock {
  type: 'list'
  ordered: boolean
  start?: number
  items: ListItemBlock[]
}
```

**处理策略**：
- 优先按 item 整体拆分（L-1, L-2）
- 有序列表跨页保留编号（L-4）

---

## QuoteBlock

```typescript
interface QuoteBlock {
  type: 'blockquote'
  blocks: Block[]
}
```

**处理策略**：
- 允许跨页（Q-1）
- 按内部段落分页（Q-2）
- 每页独立完整容器（Q-3）

---

## HrBlock

```typescript
interface HrBlock {
  type: 'hr'
}
```

**处理策略**：
- 不可拆分
- 尽量不出现在页首（R-3）

---

## ImageBlock

```typescript
interface ImageBlock {
  type: 'image'
  src: string
  alt?: string
  title?: string
}
```

**处理策略**：
- 不可拆分
- 等比缩放（I-2）
- 加载失败显示占位符

---

## CodeBlock

```typescript
interface CodeBlock {
  type: 'code'
  language?: string
  value: string
}
```

**处理策略**：
- 优先整体放置（C-1）
- 按行拆分（C-3）
- 不截断行（C-4）

---

## Inline 类型

```typescript
type Inline =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'emphasis'; children: Inline[] }
  | { type: 'inlineCode'; value: string }
```

---

## 不支持内容的降级策略

| 不支持的内容 | 降级策略 |
|-------------|---------|
| 表格 | 显示 `[Table not supported]` |
| 数学公式 | 显示 `[Math not supported]` |
| HTML 标签 | 转普通文本 |
| Mermaid | 显示 `[Diagram not supported]` |
| 脚注 | 忽略 |
