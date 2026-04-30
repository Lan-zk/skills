# Skill 开发规范

## 文档目的

本文档同时包含两部分内容，性质不同：

| 部分 | 范围 | 遵循来源 |
|------|------|---------|
| **agentskills.io 标准对齐** | frontmatter 格式、目录结构、字符限制 | agentskills.io 官方规范 |
| **项目自定义扩展** | 六层职责矩阵、七种反模式、五种设计模式 | Claude Code 内部开发规范 |

> agentskills.io 是一个**跨客户端 Skill 格式标准**（Claude Code、VS Code Copilot、Cursor、Gemini CLI 等通用）。只要 frontmatter 格式正确、description 不为空，官方 `skills-ref` 验证器就能通过。六层架构、反模式等不在标准范围内，不影响跨客户端兼容性。

**触发条件：**
- agentskills.io 标准对齐部分 → 任何需要跨客户端移植的 skill
- 项目自定义扩展部分 → 仅在 Claude Code 环境下开发的 skill

---

## 零、SKILL.md frontmatter 规范

**frontmatter 位于 SKILL.md 最顶部，是第一个必须写的区块。**

必选字段：
- `name`：小写连字符，非泛化命名
- `description`：同时说明"做什么"和"何时触发"，**最大 1024 个字符**

推荐字段：
- `license`：许可证，最大 500 字符
- `compatibility`：环境要求说明，最大 500 字符（如所需系统包、网络访问、目标客户端等）
- `metadata`：任意键值对
- `allowed-tools`：预批准可执行工具列表（实验性）

**name 命名规范：**
- 使用小写、连字符
- 不要过长，不要泛化成 `utils`、`helper`、`tools`
- 优先使用动名词或动作导向名词

```
---
name: github-trending-to-card
description: 抓取 GitHub Trending 并生成可视化卡片。当用户需要生成 GitHub 开源趋势图片时使用。
---
```

**description 路由示例（最大 1024 字符）：**

坏例子（过长/模糊）：
- "帮助处理文档"
- "处理数据"

好例子（简洁 + 触发条件）：
- "提取 PDF 文本表格、填写表单、合并文档；当提到 PDF、表单、文档提取时使用"
- "评审 UI 视觉一致性、可访问性与交互质量；当要求 review UI 或检查可访问性时使用"

---

## 一、核心分层原则

### 1.1 分层架构概述

> **agentskills.io 标准层**（左列）：Skill 目录的最小必要结构，遵循即可跨客户端兼容。
> **项目自定义层**（右列）：Claude Code 内部开发规范，不影响跨客户端兼容性。

```
┌─ agentskills.io 标准层 ─────────────────────────────────────────────┐
│  SKILL.md                                                        │
│  工作流调度层                                                      │
│  · 触发路由    · 非确定性决策    · 多步骤编排    · 按需加载下层资产  │
│  【禁止】全流程脚本化 / 无条件分支的脚本链                           │
├──────────────────────────────────────────────────────────────────┤
│  references/                                                      │
│  知识固化层                                                        │
│  · 固化的 prompt 模板    · 规范 / 规则 / checklist    · schema   │
│  【禁止】运行时动态 prompt / API 调用逻辑                         │
├──────────────────────────────────────────────────────────────────┤
│  templates/（或 assets/）                                          │
│  模板资产层                                                        │
│  · 输出模板（HTML/Markdown）    · starter 文件    · UI/CSS 壳子    │
│  【禁止】运行时逻辑 / 条件分支或数据填充规则                       │
├──────────────────────────────────────────────────────────────────┤
│  scripts/                                                          │
│  原子执行层                                                        │
│  · 文件读写 / 格式校验 / 正则匹配    · 确定性数据转换               │
│  · 编译打包    · Schema / 边界 / 存在性校验                       │
│  【禁止】LLM 调用逻辑 / Prompt 拼装 / 自然语言理解决策             │
│         / 判断输出质量的重试策略 / API Key 硬编码                   │
└──────────────────────────────────────────────────────────────────┘

┌─ 项目自定义层（非 agentskills.io 标准必需） ────────────────────────┐
│  data/                                                             │
│  数据资产层                                                         │
│  · CSV/JSON 知识库    · taxonomy    · scoring rules / lookup 表  │
│  【禁止】运行时计算 / API 调用 / 动态生成内容                       │
│  注：此层为项目内部数据组织，不影响跨客户端兼容性                    │
├──────────────────────────────────────────────────────────────────┤
│  evals/                                                            │
│  评估资产层                                                         │
│  · trigger eval    · workflow eval    · 断言 / 基准测试           │
│  【禁止】评估逻辑嵌入 SKILL.md 或 scripts/                         │
│  注：agentskills.io 中 evals 以 evals/evals.json 格式存在，        │
│       此处扩展为独立目录以支持更复杂的评估场景                       │
└──────────────────────────────────────────────────────────────────┘
```

**核心约束：**
- **SKILL.md** 是工作流的唯一调度者，是唯一可以发起 LLM 调用的层级
- **scripts/** 是不含任何推理的原子执行器
- **references/** 和 **templates/** 是数据的载体，SKILL.md 才是调用方
- **LLM 调用决策和自然语言生成逻辑永远不得委托给 scripts/**

### 1.2 六层职责矩阵

> 标注 🔷 的层级为 agentskills.io 标准必需层；标注 🔶 的层级为项目自定义扩展。

| 层级 | 负责（Allowed） | 禁止（Forbidden） |
|------|----------------|----------------|
| 🔷 **SKILL.md** | 触发路由；非确定性决策（分析/推理/总结/翻译）；多步骤编排顺序；按需加载 references/ 和 templates/ | 全流程脚本化；将多个 scripts/ 串联为长链而不嵌入 Agent 决策节点；无条件分支的"加载脚本→输出" |
| 🔷 **references/** | 固化的 prompt 模板文本；规范、规则、checklist；风格指南、schema 定义 | 执行时动态生成的 prompt；API 调用逻辑；运行时内容变化 |
| 🔷 **templates/ 或 assets/** | HTML/Markdown 输出模板；starter 文件；UI/CSS 壳子（assets/ 与 templates/ 等效，按生态惯例选用） | 运行时逻辑；条件分支；数据填充规则 |
| 🔶 **data/** | CSV/JSON 知识库；taxonomy；scoring rules / lookup 表 | 运行时计算；API 调用；动态生成的内容 |
| 🔶 **evals/** | trigger eval / workflow eval；断言、基准测试 | 评估逻辑嵌入 SKILL.md 或 scripts/（评估策略由 SKILL.md 设计，运行由 evals/ 提供） |
| 🔷 **scripts/** | 文件读写；格式校验；正则匹配；确定性数据转换（JSON 序列化/排版）；编译打包；Schema / 边界 / 存在性校验 | LLM / AI API 调用逻辑；在 scripts/ 中构建 Prompt 拼装逻辑；自然语言理解、分析、总结、翻译的决策分支；判断输出质量的重试策略；API Key 硬编码 |

### 1.3 分层边界判断标准

遇到具体代码时，用以下问题序列判断它该放在哪一层：

| 判断问题 | 答案决定 |
|---------|---------|
| 涉及 LLM 调用或自然语言生成决策？ | → 必须在 SKILL.md（禁止下沉 scripts/） |
| 涉及模板填充、结构化输出？ | → 委托给 references/ + templates/，SKILL.md 负责编排 |
| 涉及运行时动态内容？ | → SKILL.md（动态），或 references/（固化），禁止 scripts/ |
| 涉及确定性格式转换、文件操作、校验？ | → scripts/ |
| 涉及结构化知识查询（CSV/JSON/taxonomy）？ | → data/ |
| 涉及评估用例、断言、基准测试？ | → evals/ |
| 是否同时满足四要素（触发语言、工作流、输出物、评估标准均明显不同）？ | → 若否，作为单一 skill 内的子模块，不拆新 skill |

**四要素测试详解：**
只有当以下四项**全部**明显不同时，才建议拆为新的顶层 skill：
1. **触发语言**：用户表达需求的方式是否明显不同
2. **工作流**：完成任务的核心步骤是否明显不同
3. **输出物**：交付的结果类型是否明显不同
4. **评估标准**：怎样算成功是否明显不同

若只是数据不同、参考资料不同、脚本不同，不应拆成新的顶层 skill。

### 1.4 scripts/ 中 if/else 的判定规则

scripts/ 中可以有 if/else，但必须基于**结构化字段值**，不能基于语义判断：

```
// ✓ 合法：基于结构化字段值
if (args.lang === 'zh') { ... }
if (item.type === 'github_trend') { ... }

// ✗ 违规：基于语义理解
if (content.includes('API')) { ... }       // 语义判断
if (score > 0.7) { ... }                   // 需要理解 score 的含义
```

---

## 二、Script Devolution 反模式

### 2.1 问题定义

**Script Devolution（脚本降级）** 是指：SKILL.md 在 Skill 开发过程中逐渐失去工作流编排能力，演变为一个 thin wrapper，最终由 scripts/ 承接所有非确定性推理逻辑。AI 倾向于这种降级，因为脚本比推理更"安全"、更"省力"。

### 2.2 七种反模式

#### 反模式一：推理下沉（Reasoning Descent）

**表现：** SKILL.md 仅剩"加载 script X → 返回结果"，所有条件判断、路由、分支逻辑全部移入 scripts/。

```
// ✗ 反模式
SKILL.md：
## 执行步骤
1. 加载 scripts/analyze.mjs
2. 返回结果

scripts/analyze.mjs：
// ← 推理逻辑全在这里
if (content.includes('API')) { ... }
if (score > 0.7) { ... }
```

**判断方法：** 若删除 SKILL.md，仅运行 scripts/ 仍能得到相同结果，则发生了推理下沉。

**正确做法：** 推理和判断保留在 SKILL.md；scripts/ 仅执行原子性的格式化或校验操作。

---

#### 反模式二：Prompt 封装进 scripts/（Prompt Encapsulation）

**表现：** LLM 调用逻辑（含 SYSTEM_PROMPT、USER_PROMPT、重试策略）全部写在 scripts/ 中，SKILL.md 对 prompt 内容完全黑盒。

```
// ✗ 反模式
scripts/llm_translate.mjs：
const SYSTEM_PROMPT = `你是一个翻译专家...`;  // ← 违规
const retryLogic = await callLLM(SYSTEM_PROMPT, ...);

// ✓ 正确
SKILL.md：
## 翻译
加载 'references/translation-prompt.md' 获取 SYSTEM_PROMPT
使用 LLM 调用（SKILL.md 层面），判断何时重试
```

**正确做法：** SYSTEM_PROMPT 固化在 `references/`，SKILL.md 读取并决定何时调用 LLM。

---

#### 反模式三：Scripts 长链（Scripts Long Chain）

**表现：** SKILL.md 将 3 个以上 scripts/ 顺序串联，无任何 Agent 决策节点，每个脚本的输出直接作为下个脚本的输入。

```
// ✗ 反模式
SKILL.md：
1. scripts/fetch.mjs → 2. scripts/clean.mjs → 3. scripts/enrich.mjs → 4. scripts/format.mjs → 输出
```

**问题：** 若中间某步输出不符合预期，链条无法感知错误，只能等最终输出后才能发现。

**正确做法：** 在相邻 scripts/ 之间插入 Agent 决策节点（判断输出质量、决定是否重试或跳过）。

---

#### 反模式四：条件 Prompt 拼接（Conditional Prompt Assembly）

**表现：** scripts/ 中包含根据输入内容动态拼接 prompt 片段的逻辑（如 `if (lang === 'zh') prompt += '用中文回复'`）。

**判断方法：** 若 scripts/ 的行为因输入语义而变化（不是因结构化字段值），则属于此反模式。

**正确做法：** 所有 prompt 片段固化在 `references/`，SKILL.md 负责根据语义判断加载哪个片段并组装。

---

#### 反模式五：输出质量判断嵌入 scripts/

**表现：** scripts/ 内含"判断 LLM 输出是否合格"的逻辑（如 `if (!isValidOutput(result)) { retry() }`），且判断标准涉及语义理解。

**正确做法：** 质量判断上浮至 SKILL.md；scripts/ 只负责执行确定性的格式校验（如 JSON Schema 验证）。

---

#### 反模式六：API Key 依赖（API Key Hardcoding）

**表现：** LLM API Key 或调用凭证硬编码在 scripts/ 中，而非统一从环境变量读取。

```
// ✗ 反模式
scripts/llm.mjs：
const apiKey = 'sk-xxxx';  // ← 违规

// ✓ 正确
scripts/llm.mjs：
const apiKey = process.env.LLM_API_KEY;  // 仅读取，不持有
```

**正确做法：** API Key 配置在环境变量或 `.env` 文件中，scripts/ 仅读取，不持有、不传递、不记录凭证内容。

---

#### 反模式七：SKILL.md 知识仓库化（SKILL.md as Knowledge Dump）

**表现：** SKILL.md 塞入大量背景知识、长说明、样例文档，体积臃肿，触发条件和决策逻辑被淹没。

**正确做法：** 长说明、领域规则、详细样例下沉至 `references/`，SKILL.md 仅保留触发条件、工作流步骤和输出契约。

**量化标准：** agentskills.io 推荐 SKILL.md 主体不超过 500 行/5000 tokens；超过此范围且大部分内容不包含工作流指令时，触发此反模式。

---

### 2.3 自检清单

| # | 检查项 | 若违规 |
|---|--------|--------|
| 1 | SKILL.md 能在没有 scripts/ 的情况下描述完整工作流？ | 反模式一 |
| 2 | 所有 SYSTEM_PROMPT 固化在 references/？ | 反模式二 |
| 3 | SKILL.md 有 Agent 决策节点（非纯脚本链）？ | 反模式三 |
| 4 | scripts/ 不含 prompt 相关字符串拼接或模板逻辑？ | 反模式四 |
| 5 | 质量判断在 SKILL.md 而非 scripts/？ | 反模式五 |
| 6 | scripts/ 不持有或硬编码 API Key？ | 反模式六 |
| 7 | SKILL.md 体积合理（知识内容已下沉 references/）？ | 反模式七 |

---

## 三、设计模式选择

### 3.1 五种设计模式

| 模式 | 英文名 | 何时使用 | SKILL.md 核心行为 | 委托目标 |
|------|--------|---------|-----------------|---------|
| 工具封装 | Tool Wrapper | 让 Agent 掌握特定库或框架的知识 | 监听关键词，按需加载 references/ | references/ 为主 |
| 生成器 | Generator | 确保每次输出的文档结构一致 | 加载模板和指南，引导用户填充变量，再执行填充 | templates/ + references/ |
| 审查器 | Reviewer | 自动化代码审查或合规审计 | 加载 checklist，遍历执行，输出按严重程度分级的报告 | references/ |
| 反转 | Inversion | 防止 Agent 在需求不明确时乱猜 | 按阶段提问，严格门控，不得在所有阶段完成前输出最终结果 | 无外部委托（SKILL.md 内部状态） |
| 流水线 | Pipeline | 确保复杂任务的每个步骤都被执行 | 依次执行步骤，门控检查，失败则停止 | 依次委托 references/ + scripts/ |

### 3.2 模式与层分的交互约束

```
Tool Wrapper（工具封装）
  → references/ 为主，templates/（或 assets/）为辅
  → SKILL.md 按需加载（加载 'references/xxx.md' 获取规范），不做固定编排

Generator（生成器）
  → templates/（或 assets/）存放输出模板
  → references/ 存放风格指南
  → SKILL.md 负责加载模板和指南，引导用户填充变量，再执行填充
  → 变量来源：模板占位符定义在 templates/，缺失时向用户询问

Reviewer（审查器）
  → references/ 中的 checklist 是核心资产
  → SKILL.md 遍历执行，scripts/ 可辅助断言验证

Inversion（反转）
  → 无外部委托
  → SKILL.md 完全主导多轮交互，严格门控，不得在收集完成前输出最终结果

Pipeline（流水线）
  → references/ + scripts/ 依次被调用
  → SKILL.md 在步骤之间执行门控检查，检查点失败则停止
```

### 3.3 组合模式

| 组合 | 说明 |
|------|------|
| Inversion → Generator | 先反转收集需求，再接生成器填充模板（最常见） |
| Pipeline + Reviewer | Pipeline 末尾嵌入自检步骤 |
| Tool Wrapper + Reviewer | 先注入规范知识，再评审 |
| Pipeline 内嵌 Inversion | 每个步骤之间的菱形门控确认，本质是 Inversion 模式的局部应用 |

### 3.4 最简 SKILL.md 片段（可直接引用）

```
Tool Wrapper:   加载 'references/xxx.md'，将规范应用于用户代码
Generator:      加载 'templates/xxx.md' + 'references/style.md'，向用户询问缺失变量，填充模板
Reviewer:      加载 'references/checklist.md'，遍历每条规则，输出按严重程度分级的报告
Inversion:      按阶段提问，不得在所有阶段完成前综合输出
Pipeline:       依次执行步骤，步骤失败则停止，向用户确认后再进入下一步
```

### 3.5 高自由度与低自由度

**高自由度 Skill**（上下文依赖强、解决方案不唯一、需要模型发挥判断力）：
- 做法：给原则，给资源入口，不强绑死命令

**低自由度 Skill**（步骤必须固定、出错代价高、结果需要强一致性）：
- 做法：明确步骤，明确脚本，明确不要改动参数

---

## 四、SKILL.md 内容规范

| 放在 SKILL.md 的内容 | 不放在 SKILL.md 的内容 |
|--------------------|---------------------|
| 任务定义 | 大段背景知识 |
| 触发边界 | 大量样例 |
| 工作流步骤 | 结构化数据（→ data/） |
| 输出契约 | 评估断言（→ evals/） |
| 资源导航（加载 references/ 的指令） | 运行时逻辑 |

### 4.1 顶层 Skill 数量控制

- **推荐数量**：3 到 4 个
- **谨慎上限**：7 个左右
- 超过 7 个必须引入分组、路由层或检索层

---

## 五、审查清单

### 5.1 提交前自检（所有提交必须执行）

**分层原则检查：**

| # | 检查项 | 量化标准 | 级别 |
|---|--------|---------|------|
| L1 | SKILL.md 能独立描述完整工作流 | 删除 scripts/ 后仍可读懂工作流骨架 | 【强制】 |
| L2 | 所有 SYSTEM_PROMPT / USER_PROMPT 固化在 references/ | grep 搜索 scripts/ 无 prompt 关键词 | 【强制】 |
| L3 | LLM 调用或自然语言生成逻辑在 SKILL.md | — | 【强制】 |
| L4 | scripts/ 长链之间嵌入 Agent 决策节点 | 3 个以上 scripts 串联时必须检查 | 【强制】 |
| L5 | scripts/ 不含 prompt 拼接、条件分支、质量判断 | — | 【强制】 |
| L6 | API Key 在环境变量，scripts/ 不持有凭证 | grep 搜索 scripts/ 无 apiKey、token 等敏感词 | 【强制】 |
| L7 | SKILL.md 体积合理（agentskills.io 推荐不超过 500 行/5000 tokens，超出过且不含工作流指令时触发） | agentskills.io 标准建议 | 【强制】 |
| L8 | templates/、data/、evals/ 各司其职 | — | 【强制】 |

**设计模式检查：**

| # | 检查项 | 量化标准 | 级别 |
|---|--------|---------|------|
| P1 | 选用模式与任务类型匹配 | 对照本文档第三节模式匹配表 | 【强制】 |
| P2 | SKILL.md 模式行为与层分约束一致 | 对照本文档第三节交互约束表 | 【强制】 |
| P3 | 组合模式时分层职责清晰 | — | 【推荐】 |

**Skill 边界判定检查：**

| # | 检查项 | 量化标准 | 级别 |
|---|--------|---------|------|
| D1 | 触发语言是否明显不同 | 四要素测试 | 【推荐】 |
| D2 | 工作流是否明显不同 | 四要素测试 | 【推荐】 |
| D3 | 输出物是否明显不同 | 四要素测试 | 【推荐】 |
| D4 | 评估标准是否明显不同 | 四要素测试 | 【推荐】 |
| D5 | frontmatter name 符合规范 | 小写连字符，非泛化命名 | 【强制】 |
| D6 | frontmatter description 同时说明"做什么"和"何时触发" | — | 【强制】 |

**评估完整性检查：**

| # | 检查项 | 量化标准 | 级别 |
|---|--------|---------|------|
| E1 | 至少包含 trigger eval（should-trigger / should-not-trigger） | — | 【强制】* |
| E2 | 至少包含 workflow eval（happy / ambiguous / failure path） | — | 【强制】* |
| E3 | 有可执行的断言（非"输出包含某词"类弱断言） | — | 【强制】* |
| E4 | 有 baseline 对比（with-skill vs without-skill） | pass rate / token / 时间 / 失败模式 | 【推荐】 |

> *E1~E3 对非平凡 Skill 为强制要求。

### 5.2 断言判定标准

**坏断言：**
- "输出文件存在"
- "输出里提到了某个词"

**好断言：**
- 输出是否完成了关键任务
- 输出是否满足结构约束
- 输出是否通过验证脚本
- 输出是否真的解决了业务需求

### 5.3 门控级别

| 级别 | 触发条件 | 检查项 |
|------|---------|--------|
| **L0 - 强制门控** | 任何提交 | L1~L8 + P1~P2 + D5~D6 + E1~E3 |
| **L1 - 增强检查** | 有 baseline 需求时 | L0 + D1~D4 + P3 + E4 |
| **L2 - 人工审查** | 首次发布 / 重大重构 | 维护者人工 review |

**人工 review 建议类型：**
- 设计决策
- 文案与描述
- 报告与总结
- 多模态产物
- 高层决策建议

---

## 六、常见问题

**Q：SKILL.md 里可以调用 LLM 吗？**
A：可以。SKILL.md 是唯一可以发起 LLM 调用的层级。scripts/ 禁止。

**Q：scripts/ 里可以有 if/else 吗？**
A：可以，但 if/else 必须基于结构化字段值（如 `args.lang === 'zh'`），不能基于语义判断。详见 1.4 节。

**Q：什么时候该拆 Skill，什么时候该在 Skill 内新建子模块？**
A：用四要素测试（触发语言、工作流、输出物、评估标准），四项都明显不同时才拆 Skill。详见 1.3 节四要素测试。

**Q：references/ 和 templates/ 有什么区别？**
A：references/ 存放 prompt 模板和规范文本（供 SKILL.md 读取）；templates/ 存放输出模板（如 HTML/Markdown，用于最终产出的排版）。

**Q：assets/ 和 templates/ 用哪个？**
A：两者等效，按生态惯例选用。目录结构规范允许二选一或并存。

**Q：Skill 数量应该怎么控制？**
A：默认 3-4 个，谨慎上限 7 个。超过 7 个必须引入分组、路由层或检索层。

**Q：Skill 发布前必须有哪些内容？**
A：必选：SKILL.md（frontmatter + 工作流）、L1-L8 自检通过。可选但强烈推荐：evals/（非平凡 Skill）、references/、templates/。
