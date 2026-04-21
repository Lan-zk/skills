# writing 技能架构改造实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：**将 `why-writing/` 重构为多模式写作技能 `writing/`，WHY 成为四种模式之一，SKILL.md 变为纯路由层。

**Architecture：**纯文档重组，无代码改动。文件迁移 + 内容拆分 + 新增 references/modes/ 目录 + SKILL.md 重写。

**Tech Stack：**无（纯 Markdown 文档操作）。

---

## 文件变更总览

| 操作 | 文件路径 |
|------|----------|
| 重命名 | `why-writing/` → `writing/` |
| 修改 | `writing/SKILL.md` |
| 修改 | `writing/README.md` |
| 修改 | `CLAUDE.md` |
| 创建 | `writing/references/modes/` |
| 迁移 | `references/core-methodology.md` → `references/modes/why-deep.md` |
| 新建 | `references/modes/mode-selector.md` |
| 拆分 | `references/voice-guide.md` → 保留通用部分，why-deep 专属移入 `why-deep.md` |
| 新建 | `references/modes/observe.md` |
| 新建 | `references/modes/craft.md` |
| 新建 | `references/modes/snippet.md` |
| 新建 | `references/vibe-voice-overrides.md` |
| 重写 | `references/examples.md` |
| 轻调 | `references/self-check.md` |
| 删除 | `references/core-methodology.md`（内容已迁移） |
| 删除 | `references/entry-types.md`（内容已迁移） |

---

## Task 1: Rename

- [ ] **Step 1: 重命名目录**

```bash
mv why-writing/ writing/
```

- [ ] **Step 2: 更新 SKILL.md frontmatter**

打开 `writing/SKILL.md`，将 frontmatter 从：

```yaml
---
name: why-writing
description: Use when writing insight-driven long-form articles, newsletter issues, or blog posts that should lead readers through a real thinking process, especially when the goal is cognitive reframing rather than information completeness or personal storytelling.
```

改为：

```yaml
---
name: writing
description: Use when writing long-form articles, newsletter, personal essays, narrative nonfiction, or short-form commentary. Supports multiple writing modes — auto-detects genre and selects the appropriate style, or accepts manual mode override.
```

- [ ] **Step 3: 更新 README.md 标题**

打开 `writing/README.md`，将标题改为 `writing`，副标题/描述更新为"多模式写作技能，支持 why-deep / observe / craft / snippet 四种写作风格"。

- [ ] **Step 4: 更新 CLAUDE.md 中的引用**

打开 `CLAUDE.md`，将所有 `why-writing/` 替换为 `writing/`。

- [ ] **Step 5: 全局搜索其他引用**

在项目根目录搜索所有包含 `why-writing` 的文件：

```bash
grep -r "why-writing" --include="*.md" --include="*.json" --include="*.yaml" .
```

逐一检查并替换为 `writing/`。

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor: rename why-writing to writing, update frontmatter and all references"
```

---

## Task 2: 创建 modes/ 目录并迁移 why-deep

- [ ] **Step 1: 创建 modes/ 目录**

```bash
mkdir -p writing/references/modes
```

- [ ] **Step 2: 创建 references/modes/why-deep.md**

读取现有 `writing/references/core-methodology.md` 的全部内容，将其写入 `writing/references/modes/why-deep.md`。

文件开头增加：

```markdown
# why-deep：论辩散文

**学名**：Analytical Essay / 论辩散文
**推进动力**：逻辑链
**结论位置**：论证终点

---

```

- [ ] **Step 3: 从 voice-guide.md 提取 why-deep 专属内容并追加**

读取 `writing/references/voice-guide.md`，将以下内容追加到 `why-deep.md` 末尾：

- "六条主规则"中 why-deep 专属的规则（规则 2.5 层级感、规则 6.5 结尾新增位移）
- "受控发散示例"（钻井型发散规则）
- "前提、概念、代价的顺序"（如果这部分在 core-methodology 里）

在追加的内容前加分隔线：

```markdown
---

## 以下内容从 voice-guide.md 迁移

```

- [ ] **Step 4: 删除已迁移的原文件**

```bash
rm writing/references/core-methodology.md
```

> 注意：如果 core-methodology 和 entry-types 的内容在同一个文件里（需确认），则删除操作在 Task 3（迁移 entry-types）之后执行。

- [ ] **Step 5: Commit**

```bash
git add writing/references/modes/why-deep.md
git commit -m "feat: create modes/why-deep.md with migrated core-methodology content"
```

---

## Task 3: 新建 mode-selector.md（融合 entry-types + auto-detection）

- [ ] **Step 1: 创建 references/modes/mode-selector.md**

写入以下内容（完整文件）：

```markdown
# Mode Selector：模式选择器

## 四种模式定义

| 模式 | 学名 | 推进动力 | 结论位置 | 适用场景 |
|------|------|----------|----------|----------|
| `why-deep` | Analytical Essay / 论辩散文 | 逻辑链 | 论证终点 | 深度长文、前提级重构 |
| `observe` | Personal Essay / 随笔 | 思维流 | 可悬置 | newsletter、个人观察笔记 |
| `craft` | Narrative Nonfiction / 叙事散文 | 事件序列 | 叙事终点 | 个人故事、经历类 |
| `snippet` | Short-form Commentary / 微内容 | 认知冲击 | 即时产出 | 小红书图文、短观点 |

详细学名定义见 `../../writing-mode-taxonomy.md`（项目根目录）。

---

## 自动检测规则（三层门控）

### 第一层：格式信号（最强）

按以下关键词映射：

- `"newsletter"` / `"个人笔记"` / `"观察笔记"` → `observe`
- `"小红书"` / `"短图文"` / `"朋友圈"` / `"微博"` → `snippet`
- `"个人故事"` / `"经历"` / `"叙事"` → `craft`
- `"深度"` / `"分析"` / `"前提"` / `"重写"` → `why-deep`
- `"技术解析"` / `"教程"` / `"工具介绍"` → `snippet`（无前提可挖）

> 如果用户输入包含多个关键词，优先级按从上到下；若无关键词命中，进入第二层。

### 第二层：深度信号

- 有默认前提可挖（旧解释开始解释不完）→ `why-deep`
- 事件驱动、故事型 → `craft`
- 无前提、浅层话题 → `snippet`
- 不确定 → 回退 `observe`

### 第三层：语气信号（最弱）

- 反思性、慢节奏语气 → `observe`
- 闲聊、轻快语气 → `snippet`

### 完全不确定

主动询问用户：

```
这篇文章你想要哪种写作风格？
- why-deep：深度分析，逻辑推进，层层下潜到前提
- observe：观察笔记，思维散步，允许没有完整结论
- craft：叙事优先，用故事带出判断
- snippet：短平快，认知冲击，不下潜
```

---

## 手动 Override

用户可以主动指定模式，格式不限制：

- `"用 snippet 写"` / `"这次用 craft"`
- `"--vibe observe"` / `"vibe: why-deep"`

Override 优先级：**手动指定 > 自动检测 > 默认 why-deep**。

---

## observe / craft 边界说明

Codex review 指出两者最接近，以下决策指引区分二者：

| 判断维度 | observe | craft |
|----------|---------|-------|
| 推进靠什么 | 思维的内转——观察者的注意力移动 | 事件的外推——发生了什么推动了判断 |
| 结尾状态 | 可以停在"还在想" | 必须停在"故事讲完了，判断站住了" |
| "我"的位置 | 我是观察者，和对象处于同一平面 | 我是经历者，故事经过我，但不是关于我 |
| 典型触发词 | "我注意到"/"有意思的是"/"让我困惑的是" | "那天"/"后来"/"直到"/"结果" |

如果仍不确定 → `observe`（默认更安全的选项）。

---

## 模式加载规则

1. 读取 `AUTHOR.md` 作为作者底座
2. 读取本文档（`mode-selector.md`）获取模式定义和检测规则
3. 根据选定的 mode，加载 `references/modes/<mode-name>.md`
4. 应用 `references/vibe-voice-overrides.md`（`snippet` / `observe` 模式激活）
5. 执行成稿，输出前经 `references/self-check.md` 通用门控过滤
```

- [ ] **Step 2: Commit**

```bash
git add writing/references/modes/mode-selector.md
git commit -m "feat: add mode-selector.md with auto-detection rules and observe/craft boundary guide"
```

---

## Task 4: 拆分 voice-guide.md，迁移 entry-types

- [ ] **Step 1: 读取现有 voice-guide.md**

确认以下内容块的去向：

**保留在 voice-guide.md（通用）**：
- "一、总边界"全部
- "二、六条主规则"中：规则 1、规则 3、规则 4、规则 5、规则 5.5（均为通用文风规则）
- "三、转场词清单"——通用转场词
- "四、口语化推进"——通用口语化指引
- "六、补充：AI味重段落怎么返工"——通用返工步骤（步骤 1-6 全部通用）

**移入 why-deep.md**：
- 规则 2：转场像人在带问题（钻井型专属）
- 规则 2.5：总问题不要亮得太早（why-deep 专属）
- 规则 2.6：层级感可以有，层级词要少（why-deep 专属）
- 规则 6.5：结尾段要有新增位移（why-deep 专属）
- "五、补充：阅读牵引力"（钻井型牵引力）

**移入 modes/observe.md / craft.md**（在 Task 5 中处理）

- [ ] **Step 2: 重写 voice-guide.md 为通用版**

文件开头：

```markdown
# 文风指南（通用）

本文档包含跨所有模式通用的文风规则。
why-deep 专属约束见 `modes/why-deep.md`。
```

写入保留内容，去除迁移内容。

- [ ] **Step 3: 读取 entry-types.md 并确认迁移**

读取 `writing/references/entry-types.md`，确认 A/S 分级内容归宿：
- A 类 / S 类分级 → 移入 `mode-selector.md`（作为 why-deep 的下潜深度选项）
- 三种入口类型（还原式/追问式/重构式）→ 移入 `modes/why-deep.md`
- "常见误判" → 移入 `modes/why-deep.md`

- [ ] **Step 4: 追加 entry-types 内容到 why-deep.md**

将"三种入口类型"和"常见误判"追加到 `why-deep.md`（加分隔线）。

- [ ] **Step 5: 删除 entry-types.md**

```bash
rm writing/references/entry-types.md
```

- [ ] **Step 6: Commit**

```bash
git add writing/references/voice-guide.md writing/references/modes/why-deep.md
git rm writing/references/entry-types.md
git commit -m "refactor: split voice-guide.md to generic + why-deep specific, migrate entry-types to why-deep"
```

---

## Task 5: 新建 observe / craft / snippet / vibe-voice-overrides

- [ ] **Step 1: 创建 references/vibe-voice-overrides.md**

```markdown
# Vibe Voice Overrides

本文档是 AUTHOR.md 的 tone 补丁，仅在 `snippet` 和 `observe` 模式下激活。
所有调整应在 200 字以内——tone 补丁必须轻，不能变成第二套 AUTHOR.md。

---

## snippet 模式的 tone 补丁

适用条件：选定 snippet 模式时，以下调整在 AUTHOR.md 基础上叠加。

- 允许更直接的肯定句，不需要每句都有推演支撑
- 允许感叹号在认知冲击句中出现（禁用于 AUTHOR.md 的其他场景）
- 允许轻微的非正式表达，不需要全是克制语气
- **禁止事项**：
  - 仍然禁止和稀泥式平衡（继承自 AUTHOR.md）
  - 仍然禁止廉价乐观（继承自 AUTHOR.md）
  - 禁止 bullet-point list 形式的"伪微内容"——每个 snippet 单元内必须有至少一个完整思考闭环

---

## observe 模式的 tone 补丁

适用条件：选定 observe 模式时，以下调整在 AUTHOR.md 基础上叠加。

- 允许"暂时没有结论"的段落——观察笔记可以停在悬而未决处
- 允许比 why-deep 更暖的叙述语气——这不是冷硬判断，这是"正在看"
- 允许轻微的私人连接，但不要变成自我表演
- **禁止事项**：
  - 仍然禁止廉价抒情（继承自 AUTHOR.md）
  - 禁止流水账式观察——每 2-3 段必须有一条隐性判断在底下
  - 禁止用观察报告的语气写随笔——观察者和对象不能永远是分离的两个东西
```

- [ ] **Step 2: 创建 references/modes/observe.md**

```markdown
# observe：随笔

**学名**：Personal Essay / 蒙田式随笔
**推进动力**：思维流
**结论位置**：可悬置
**失败模式最容易漂移成**：流水账式观察（无分析线）

---

## 核心定义

以**思维散步**为主要节奏，允许结论悬而未决，思考的路径本身即是内容。
不以说服为目的，以**认知呈现**为目的——让读者看见一个思维活跃的人如何看世界。

observer 和对象处于同一平面，互相渗透。
不同于"观察报告"：观察报告有清晰的观察者/被观察者边界；随笔里这个边界是模糊的。

---

## 最少必要约束

1. 每 2-3 段必须有一条隐性判断在底下——观察可以慢，判断必须存在
2. "我"要出现在第一人称视角，但"我"的作用是连接私人与公共，不是自我表演
3. 允许没有完整结论——可以停在"我还在想这里"
4. 禁止流水账：每一个观察片段都要有一个被它带出来的更锐利的感知
5. 禁止观察报告腔：不要写"我观察到了 X，X 有以下三个特点"——这不是随笔，是调研报告

---

## demo 示例（待填充）

> 用户研究阶段提供真实样本后替换此处。

示例 1（印象中的随笔节奏）：
[待用户填充：真实文章片段]

示例 2（思维散步的转场）：
[待用户填充：真实文章片段]
```

- [ ] **Step 3: 创建 references/modes/craft.md**

```markdown
# craft：叙事散文

**学名**：Narrative Nonfiction / 叙事散文
**推进动力**：事件序列
**结论位置**：叙事终点（故事讲完，判断才站住）
**失败模式最容易漂移成**：故事加教训（教训先行，故事变包装）

---

## 核心定义

以**事件序列**为主要推进动力，文章的运动来自"发生了什么"的叙事张力。
判断和结论通过故事的展开被**带出**而不是被**宣告**。
论点寓于事件之中，不是寓于论证之中。

**故事是论点，不是论点的包装。**

如果结论在故事开始前就能说出来，这个故事就是多余的。
如果结论在故事结束后还不能站住，这个故事就没有完成它的任务。

---

## 最少必要约束

1. 故事必须是真实经历或基于真实经历的变形，虚构需要标注
2. 判断必须在故事叙事完成后才完整——不能在叙事中途或开头就说出结论
3. 故事服务于一个隐性的前提——作者在故事里选择呈现什么、忽略什么，本身就是判断
4. 禁止"故事+教训"的二分结构——教训不能以显性"所以说"/"这告诉我们"/"最后我想说"的形式出现
5. "我"在叙事中可以出现，但"我"是经历的承受者和反思者，不是主角光环的展示者

---

## demo 示例（待填充）

> 用户研究阶段提供真实样本后替换此处。

示例 1（叙事带出判断的结构）：
[待用户填充：真实文章片段]

示例 2（故事如何选择细节）：
[待用户填充：真实文章片段]
```

- [ ] **Step 4: 创建 references/modes/snippet.md**

```markdown
# snippet：微内容

**学名**：Short-form Commentary / 微内容
**推进动力**：认知冲击
**结论位置**：即时产出
**失败模式最容易漂移成**：AI-listicle（干瘪短句堆砌）

---

## 核心定义

以**认知冲击**本身为目的，在极短篇幅内完成一个完整的"感知-判断-表达"闭环。
不下潜，不发散，不展开，密度即价值。

每一句都在工作。不留废话。不靠句号制造节奏感，用的是思维密度。

---

## 最少必要约束

1. 每个 snippet 单元必须有一个完整的思考闭环——感知、困惑、判断，三件事在一个紧凑单元内完成
2. 禁止 bullet-point list 形式的"伪微内容"——list 形式天然消解密度
3. 禁止连续感慨——感叹号和感叹语气不能作为密度的替代品
4. 允许一个 snippet 内部有一层翻转（"我以为是 X，其实 Y"），但不能有两层以上
5. snippet 的节奏靠断句实现，不是靠换行——一行之内完成一个认知动作

---

## demo 示例（待填充）

> 用户研究阶段提供真实样本后替换此处。

示例 1（认知翻转在一个单元内完成）：
[待用户填充：真实片段]

示例 2（没有 list 的密集短单元）：
[待用户填充：真实片段]
```

- [ ] **Step 5: Commit**

```bash
git add writing/references/vibe-voice-overrides.md \
  writing/references/modes/observe.md \
  writing/references/modes/craft.md \
  writing/references/modes/snippet.md
git commit -m "feat: add observe, craft, snippet modes and vibe-voice-overrides"
```

---

## Task 6: 重写 examples.md + 轻调 self-check.md

- [ ] **Step 1: 重写 references/examples.md**

将现有 examples.md 迁移内容整合，然后新增其他三个 mode 的示例：

```markdown
# 示例库

本文件按 mode 分类，提供每种模式的真实文章片段作为参考。
WHY 相关示例保留自原文件；observe / craft / snippet 示例在用户研究阶段填充真实样本后替换 demo 占位符。

---

## why-deep 示例

保留自原 examples.md 的开头/转场/结尾/坏例/返工示例。

---

## observe 示例

[待用户研究后填充真实样本]

---

## craft 示例

[待用户研究后填充真实样本]

---

## snippet 示例

[待用户研究后填充真实样本]
```

- [ ] **Step 2: 轻调 self-check.md**

读取 `writing/references/self-check.md`，检查以下条目是否具有 mode-specific 性质：

- "掀开的默认前提是什么" → why-deep 专属，移到 `modes/why-deep.md`
- "钻井感/推进感"相关检查项 → why-deep 专属，移到 `modes/why-deep.md`

保留通用检查项：
- "有没有哪几段太会命名"（通用 AI 味检测）
- "主标题是不是短、准、贴题"（通用标题规则）
- "单句成段是不是过量"（通用版式规则）

在文件开头注明：本文档为跨模式通用质检清单，why-deep 专属检查项见 `modes/why-deep.md`。

- [ ] **Step 3: Commit**

```bash
git add writing/references/examples.md writing/references/self-check.md
git commit -m "refactor: rewrite examples.md with cross-mode structure, trim self-check.md to generic-only"
```

---

## Task 7: 重写 SKILL.md 为路由层

- [ ] **Step 1: 读取现有 SKILL.md**

确认需要保留的部分：
- "## 什么时候用"（改为引用 mode-selector.md 的模式定义）
- "## 成稿输出"中的标题规则和结尾约束（通用）
- "## 禁区红线"（通用）
- "## 成稿质检"（改为引用 self-check.md）
- frontmatter（已在 Task 1 更新）

需要删除/替换的部分：
- "## 核心任务" → 移到 `modes/why-deep.md`
- "## 约束分层" → 移到 `modes/why-deep.md`
- "## 使用顺序" → 移到 `modes/why-deep.md`
- "## 默认运动方式"（钻井型） → 移到 `modes/why-deep.md`
- "## 深挖优先级" → 移到 `modes/why-deep.md`
- "## 段落动作" → 移到 `modes/why-deep.md`
- "## 题材分级" → 移到 `modes/mode-selector.md`
- "## 成稿输出"中 WHY 专属的标题风格描述 → 移到 `modes/why-deep.md`

- [ ] **Step 2: 重写 SKILL.md**

新的 SKILL.md 结构：

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add writing/SKILL.md
git commit -m "refactor: rewrite SKILL.md as routing layer, delegate to modes/"
```

---

## 自检清单

| # | 检查项 | 对应 Task |
|---|--------|-----------|
| 1 | 目录已重命名为 `writing/` | Task 1 |
| 2 | frontmatter name 改为 `writing` | Task 1 |
| 3 | CLAUDE.md 和所有项目引用已更新 | Task 1 |
| 4 | `references/core-methodology.md` 已删除，内容迁入 `modes/why-deep.md` | Task 2 |
| 5 | `references/entry-types.md` 已删除，内容迁入 `modes/mode-selector.md` + `why-deep.md` | Task 4 |
| 6 | `voice-guide.md` 拆分为通用 + why-deep 专属 | Task 4 |
| 7 | `modes/observe.md`、`craft.md`、`snippet.md` 已创建（demo 保底） | Task 5 |
| 8 | `vibe-voice-overrides.md` 已创建 | Task 5 |
| 9 | `examples.md` 已重写为跨模式结构 | Task 6 |
| 10 | `self-check.md` 已去除 why-deep 专属检查项 | Task 6 |
| 11 | SKILL.md 重写为路由层，无模式专属方法论 | Task 7 |
| 12 | 所有删除的文件已从 git 中移除 | Task 2, 4 |
