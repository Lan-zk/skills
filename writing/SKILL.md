---
name: writing
description: Use when writing long-form articles, newsletter, personal essays, narrative nonfiction, or short-form commentary. Supports multiple writing modes — auto-detects genre and selects the appropriate style, or accepts manual mode override.
---

# writing

## 模式入口

writing 支持四种写作模式。详细定义、auto-detection 规则和 override 接口见 `references/modes/mode-selector.md`。

| 模式 | 适用场景 |
|------|----------|
| `why-deep` | 深度长文、前提级重构 |
| `observe` | newsletter、个人观察笔记 |
| `craft` | 个人故事、经历类 |
| `snippet` | 小红书图文、短观点 |

## 写作流程

1. 读取 `AUTHOR.md` 作为作者底座
2. 读取 `references/modes/mode-selector.md`，执行模式检测或确认 override
3. 加载对应 `references/modes/<mode>.md`
4. 应用 `references/vibe-voice-overrides.md`（snippet / observe 模式）
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
why-deep 专属检查见 `references/modes/why-deep.md`。

## 文件索引

| 文件 | 内容 |
|------|------|
| `AUTHOR.md` | 作者底座，跨所有模式共享 |
| `references/modes/mode-selector.md` | 模式定义、auto-detection、override |
| `references/modes/why-deep.md` | 论辩散文完整方法论 |
| `references/modes/observe.md` | 随笔模式 |
| `references/modes/craft.md` | 叙事散文模式 |
| `references/modes/snippet.md` | 微内容模式 |
| `references/vibe-voice-overrides.md` | AUTHOR.md tone 补丁 |
| `references/voice-guide.md` | 跨模式通用文风规则 |
| `references/self-check.md` | 跨模式通用质检清单 |
| `references/examples.md` | 跨模式示例库 |
