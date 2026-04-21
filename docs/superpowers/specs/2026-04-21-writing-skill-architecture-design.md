# writing 技能架构改造设计

> **状态**：草稿，待用户确认后实施
> **日期**：2026-04-21

## 目标

将 `why-writing/` 重构为通用多模式写作技能 `writing/`。WHY 成为四种写作模式之一，而非唯一正确路径。作者底座（`AUTHOR.md`）跨所有模式共享，不因模式切换而改变。

---

## Step 1：Rename

### 1.1 目录重命名

```bash
mv why-writing/ writing/
```

### 1.2 SKILL.md frontmatter 更新

```yaml
---
name: writing
description: Use when writing long-form articles, newsletter, personal essays, narrative nonfiction, or short-form commentary. Supports multiple writing modes — auto-detects genre and selects the appropriate style, or accepts manual mode override.
---
```

### 1.3 README.md 更新

标题改为 `writing`，副标题/描述相应调整为"多模式写作技能，支持 why-deep / observe / craft / snippet 四种写作风格"。

### 1.4 全局引用更新

| 文件 | 操作 |
|------|------|
| `CLAUDE.md` | `why-writing/` → `writing/` |
| 其他技能文档中所有引用 | 全局搜索 `why-writing`，全部替换 |

---

## Step 2：SKILL.md 重构为路由层

### 2.1 移除的内容

SKILL.md 不再包含：
- `core-methodology.md` 的钻井逻辑（移入 `references/modes/why-deep.md`）
- `entry-types.md` 的 A/S 分级（移入 `references/modes/mode-selector.md`）
- 任何模式的内部方法论细节

### 2.2 SKILL.md 保留的内容

- `AUTHOR.md` 底座优先原则
- 成稿质检（`self-check.md` 跨模式通用部分）
- 禁区红线（`禁区红线` 一节跨模式通用）
- 通用写作约束（加粗/引用/标题/结尾规则）

### 2.3 SKILL.md 新增内容

#### 2.3.1 模式入口

SKILL.md 开头新增模式入口说明：

```markdown
## 模式入口

writing 支持四种写作模式：

| 模式 | 定位 | 适用场景 |
|------|------|----------|
| `why-deep` | 论辩散文，逻辑推进 | 深度长文、前提级重构 |
| `observe` | 随笔，思维散步 | newsletter、个人观察笔记 |
| `craft` | 叙事散文，事件驱动 | 个人故事、经历类 |
| `snippet` | 微内容，认知冲击 | 小红书图文、短观点 |

详细定义见 `references/modes/mode-selector.md`。
```

#### 2.3.2 模式自动检测（三层门控）

```
用户输入
  ↓
格式信号检测（最强）
  → 包含 "newsletter" → observe
  → 包含 "小红书" / "短图文" → snippet
  → 包含 "个人故事" / "经历" → craft
  → 包含 "深度" / "分析" / "前提" → why-deep
  ↓ 置信度不足时
深度信号检测
  → 有默认前提可挖 → why-deep
  → 事件驱动、故事型 → craft
  → 无前提、浅层话题（工具教程/发布会） → snippet
  → 不确定 → 回退 observe
  ↓ 仍不确定
语气信号检测（最弱）
  → 反思性语气 → observe
  → 闲聊语气 → snippet
  ↓ 完全不确定
主动询问用户："你想要哪种写作风格？"
```

#### 2.3.3 手动 Override 接口

```markdown
## 手动 Override

用户可以主动指定模式，格式不限制：
- "用 snippet 写"
- "这次用 craft"
- "--vibe observe"

Override 优先级高于自动检测。
```

#### 2.3.4 模式加载规则

```markdown
## 模式加载规则

1. 读取 `AUTHOR.md` 作为作者底座
2. 读取 `references/modes/mode-selector.md` 获取模式定义和检测规则
3. 根据选定的 mode，加载 `references/modes/<mode-name>.md`
4. 应用 `references/vibe-voice-overrides.md`（如有）
5. 执行成稿，输出前经 `references/self-check.md` 通用门控过滤
```

---

## Step 3：引用文件重组

### 3.1 目录结构

```
writing/
  SKILL.md                      # 路由层（重构）
  AUTHOR.md                     # 作者底座（不动）
  README.md                      # 更新
  references/
    # 通用文件（跨模式）
    self-check.md                # 成稿质检（已有，轻调）
    examples.md                 # 跨模式示例库（重写）

    # WHY 专属 → 移入 modes/
    core-methodology.md          → references/modes/why-deep.md（内容迁移）
    entry-types.md               → references/modes/mode-selector.md（融合）

    # 部分移出
    voice-guide.md               → 拆分：通用文风规则保留，mode-specific 部分移入 modes/

    # 新增
    modes/                       # 新增目录
      mode-selector.md            # 模式定义 + auto-detection 规则 + override 接口
      why-deep.md                 # 论辩散文完整方法论
      observe.md                 # 随笔模式
      craft.md                   # 叙事散文模式
      snippet.md                 # 微内容模式
    vibe-voice-overrides.md       # AUTHOR.md tone 补丁（snippet/observe 专用）
```

### 3.2 各文件内容范围

| 文件 | 内容 | 去留 |
|------|------|------|
| `references/core-methodology.md` | 钻井四层、发散规则、前提-概念-代价顺序 | 迁移至 `modes/why-deep.md`，原文件删除 |
| `references/entry-types.md` | A/S 分级、三种入口、升级条件 | 融合至 `modes/mode-selector.md`，原文件删除 |
| `references/voice-guide.md` | 六条主规则、转场词、口语化、牵引力、AI 味返工 | 拆分：通用文风规则保留，why-deep 专属约束移入 `modes/why-deep.md` |
| `references/self-check.md` | 成稿质检清单 | 保留，轻调（去掉 why-deep 专属检查项） |
| `references/examples.md` | 示例库 | 重写为跨模式示例，每种 mode 各 1-2 个样本 |
| `references/modes/mode-selector.md` | 新建，模式定义 + auto-detection + override | 新建 |
| `references/modes/why-deep.md` | 新建，钻井方法论完整迁移 | 新建 |
| `references/modes/observe.md` | 新建 | 新建，内容待 vibe 研究后填充 demo |
| `references/modes/craft.md` | 新建 | 新建，内容待 vibe 研究后填充 demo |
| `references/modes/snippet.md` | 新建 | 新建，内容待 vibe 研究后填充 demo |
| `references/vibe-voice-overrides.md` | 新建，Option B tone 补丁 | 新建 |

---

## Step 4：vibe-voice-overrides.md 设计

### 4.1 定位

Option B：保护 AUTHOR.md 不变，用轻量补丁处理 `snippet`/`observe` 与底座的声线冲突。

### 4.2 内容结构

```markdown
# Vibe Voice Overrides

本文档是 AUTHOR.md 的 tone 补丁，仅在 `snippet` 和 `observe` 模式下激活。
所有 vibe-specific 调整都应能在一屏内读完。

## snippet 模式的 tone 补丁

适用条件：选定 snippet 模式时，以下调整在 AUTHOR.md 基础上叠加。

- 允许更直接的肯定句，不需要每句都有推演支撑
- 允许感叹号在认知冲击句中出现（禁用于 AUTHOR.md 的其他场景）
- 允许轻微的非正式表达，不需要全是克制语气
- 禁止事项：
  - 仍然禁止和稀泥式平衡（继承自 AUTHOR.md）
  - 仍然禁止廉价乐观（继承自 AUTHOR.md）
  - 新增：禁止 bullet-point list 形式的"伪微内容"——每个 snippet 单元内必须有至少一个完整思考闭环

## observe 模式的 tone 补丁

适用条件：选定 observe 模式时，以下调整在 AUTHOR.md 基础上叠加。

- 允许"暂时没有结论"的段落——观察笔记可以停在悬而未决处
- 允许比 why-deep 更暖的叙述语气——这不是冷硬判断，这是"正在看"
- 禁止事项：
  - 仍然禁止廉价抒情（继承自 AUTHOR.md）
  - 新增：禁止流水账式观察——每 2-3 段必须有一条隐性判断在底下
```

---

## Step 5：modes/*.md 内容说明

### 5.1 mode-selector.md

包含：
- 四种模式的学名定位、核心定义（引用 `writing-mode-taxonomy.md` 的内容）
- auto-detection 完整规则
- override 接口说明
- observe/craft 边界歧义说明（Codex review 指出两者最接近，需决策指引）

### 5.2 why-deep.md

当前 `core-methodology.md` + `voice-guide.md` 中 why-deep 专属内容的合并迁移。不新增逻辑，只做文件迁移。

### 5.3 observe / craft / snippet.md

**内容保底，不做完整 spec**：
- 核心定义（引用 mode-selector.md）
- failure mode guards（该模式最容易漂移成什么，需要守住的底线）
- 1-2 个 demo 示例（真实文章片段，不做完整示范）
- 最少必要约束（3-5 条，不能更少）

后续在实际使用中迭代完善。

---

## 不涉及本次的范围

| 项目 | 原因 |
|------|------|
| `AUTHOR.md` 重写或拆分 | 作者底座是核心，不在本次改动范围内 |
| 完整 vibe demo 示例库 | 留待用户研究后提供真实样本，再填充 |
| 新增第 5+ 种模式 | 四种先跑稳，再扩展 |
| 跨模式的质量对比评测 | 后续 eval 层处理 |

---

## 实施顺序

1. `why-writing/` → `writing/` rename（目录 + frontmatter + README + 全局引用）
2. 创建 `references/modes/` 目录
3. 迁移 `core-methodology.md` → `modes/why-deep.md`
4. 新建 `modes/mode-selector.md`（含 auto-detection + override + observe/craft 边界说明）
5. 拆分 `voice-guide.md`：通用部分保留，why-deep 专属移入 `modes/why-deep.md`
6. 新建 `modes/observe.md` / `craft.md` / `snippet.md`（demo 保底内容）
7. 新建 `vibe-voice-overrides.md`
8. 重写 `references/examples.md` 为跨模式示例
9. 轻调 `self-check.md`（去掉 why-deep 专属检查项）
10. 重写 `SKILL.md` 为路由层
11. 更新 CLAUDE.md 引用

---
