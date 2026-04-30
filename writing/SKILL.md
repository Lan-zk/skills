---
name: writing
description: Use when writing long-form articles, newsletter, personal essays, or narrative nonfiction. Converts ideas and collected materials into essay-like articles. Supports two modes — why-deep (logical deep-dive) and observe (perception-driven essay). Auto-detects mode from user's intent, or accepts manual override.
---

# writing

将你的 idea 和收集的素材，转写为随笔性文章。两种模式代表不同的认知切入方式，不是不同的体裁。

## 模式

| 模式 | 推进动力 | 适用场景 |
|------|----------|----------|
| `why-deep` | 逻辑链——enthymeme 推进 | 有前提可挖、旧解释开始漏水 |
| `observe` | 感知秩序与自我校准 | 承重在细节、场景、不适感 |

模式选择见 `references/modes/mode-selector.md`。

## 写作流程

1. 读取 `AUTHOR.md` 作为作者底座
2. 收集用户原始想法（自由描述，不答也行，技能兜底）
3. 读取 `references/modes/mode-selector.md`，给出模式推荐 + 理由，用户确认
4. 加载对应 `references/modes/<mode>.md`
5. 写作
6. 成稿前经 `references/self-check.md` 通用门控过滤

## 通用成稿规则

### 标题规则（跨模式）

- 默认只给 1 个标题，不给备选
- 简短，紧扣对象
- 有张力，但不靠空问句和营销腔

### 结尾规则（跨模式）

- 结尾不是总结会，也不是观点回收站
- 要么把读者停在一个更深的问题上，要么把新的站位钉稳
- 最后一句如果单拎出来像故作深沉，优先删掉

### 禁区红线（跨模式）

高频踩雷词，零容忍：

```
说白了、意味着什么、本质上、换句话说、不可否认
```

### 版式规则（跨模式）

- Markdown 用来扶住节奏，不是把文章切成说明书
- 单句成段只用于转折句、钩子句、认知翻转句
- 连续单句成段不超过 2 次
- 列表只在必要时使用
- `---` 分隔线全文不超过 2-3 次

## 成稿质检

执行成稿前，运行 `references/self-check.md` 的通用检查。
模式专属检查见各模式文档。

## 文件索引

| 文件 | 内容 |
|------|------|
| `AUTHOR.md` | 作者底座，跨模式共享 |
| `references/modes/mode-selector.md` | 模式选择流程 |
| `references/modes/why-deep.md` | 论辩散文完整方法论 |
| `references/modes/observe.md` | 随笔模式 |
| `references/voice-guide.md` | 跨模式通用文风规则 |
| `references/self-check.md` | 跨模式通用质检清单 |
| `references/examples.md` | 跨模式示例库 |
