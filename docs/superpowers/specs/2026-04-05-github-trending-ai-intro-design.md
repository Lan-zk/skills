# GitHub Trending Card — AI 项目解析增强

**Date:** 2026-04-05
**Status:** Approved

## 背景

当前 GitHub Trending 卡片中的 description 部分内容较短（通常 50 字以内），导致卡片主体区域留白过多，影响视觉平衡。用户希望在不改动现有 description 的前提下，新增一块由 AI 生成的内容区，对项目进行问题诊断式分析（解决什么问题？如何解决？）。

## 目标

在每张卡片的 repo-card 区域新增下半部分，显示 LLM 基于 README 分析生成的中文项目解析（70-150 字）。原始 description 区域保持不变，两部分独立共存。

---

## 架构

Pipeline 顺序：

```
scrapeTrending()           [不变 — 获取 TrendingItem，description 保留原始英文]
    → summarizeReadmes()      [新增 — 获取 README → LLM 生成中文项目解析]
    → translateDescriptions()  [不变 — 翻译 description 为中文]
    → renderCards()            [模板新增 ai_intro 渲染区]
```

---

## 新增文件

### `src/summarizer.ts`

```typescript
// 获取 raw README.md，失败则 fallback main → master
async function fetchReadme(owner: string, name: string): Promise<string>

// 批量：并行 fetch 所有 README，截取前 4KB，单次 LLM 调用
async function summarizeReadmes(items: TrendingItem[]): Promise<TrendingItem[]>
```

### `src/types.ts`

`TrendingItem` 新增字段：

```typescript
ai_intro?: string; // LLM 生成的中文项目解析，HTML 片段格式
```

---

## LLM Prompt 设计

### System Prompt

```
你是一位资深开源项目评审编辑，擅长从 README 和代码结构中提炼项目本质。
```

### User Message 输入结构

```
# 项目信息
项目名：{owner}/{name}
原始描述：{description}

# README 片段（已截取前 4KB）
{raw markdown}

# 输出要求
请分析 README 内容，回答以下两个核心问题，输出中文：

<b>项目解析</b>
📌 解决的问题：{一句话描述该项目旨在解决的核心问题/痛点}
🔧 解决方案：{该项目的核心实现思路或方法}

规则：
- 总字数控制在 70-150 字
- 使用 <b> 标签包裹小标题
- 不得添加 README 中不存在的虚构信息
```

### 返回格式

纯 HTML 片段，例如：

```html
<b>项目解析</b>
📌 解决的问题：在大规模前端项目中，类型定义与业务代码脱节，导致运行时错误难以在编译阶段发现。
🔧 解决方案：通过 TypeScript Compiler API 深度集成，在代码写入时即进行实时类型检查与错误预警。
```

---

## 模板改动

### 新增字段

`src/types.ts` — `TrendingItem` 增加 `ai_intro?: string`

### card.html 新增内容区域

在 `.repo-card` 底部、`.repo-divider` 和 `.repo-meta-strip` 之间插入：

```html
{{#if ai_intro}}
<div class="ai-intro-section">
  <div class="ai-intro-content">{{{ai_intro}}}</div>
</div>
{{/if}}
```

### 新增 CSS

```css
.ai-intro-section {
  padding-top: 16px;
  border-top: 1px dashed var(--color-rule);
  margin-top: 12px;
}

.ai-intro-content {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 20px;
  color: var(--color-ink-soft);
  line-height: 1.7;
}

.ai-intro-content b {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-steel);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-bottom: 8px;
}
```

---

## 错误处理

| 失败场景 | 处理方式 |
|---------|---------|
| README 404 | `ai_intro` 为空，模板 `{{#if ai_intro}}` 隐藏整块 |
| LLM API Key 缺失 | `ai_intro` 为空，优雅降级，卡片不变 |
| LLM 调用超时/失败 | `ai_intro` 为空，不阻塞其余卡片 |
| README 内容为空 | `ai_intro` 为空 |

---

## Pipeline 集成

`src/index.ts` 中 `executeSkill` 函数增加一步：

```typescript
// 2. 生成 AI 项目解析
const summarizedItems = await summarizeReadmes(trendingItems);

// 3. 翻译原始 description
const translatedItems = await translateDescriptions(summarizedItems);
```

---

## 测试

`evals/summarizer.test.ts`：

- Mock README fetch（200 成功 / 404 / 超时）
- Mock LLM response（正常 HTML / 格式异常 / 空字符串）
- 验证 `ai_intro` 字段正确写入 TrendingItem
- 验证无 API Key 时 `ai_intro` 为空，不抛出异常
- 验证 pipeline 降级：单个项目失败不影响其余

Fixtures 更新：`evals/fixtures/` 中 `renderer.test.ts` 和 `translator.test.ts` 的 TrendingItem fixtures 需补充 `ai_intro` 字段。

---

## 验收标准

1. README 获取正常的项目，生成的 `ai_intro` 字段字数在 70-150 字之间
2. README 不可用或 LLM 不可用时，卡片正常渲染，无 `ai_intro` 内容区域
3. 模板 `{{{ai_intro}}}` 使用三括号，不转义 HTML
4. 新增测试覆盖率覆盖 `summarizer.ts` 主要分支
