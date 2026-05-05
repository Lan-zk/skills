---
name: author
description: 维护动态人格底座 AUTHOR.md，通过 AI 观察捕获和对话式蒸馏持续逼近更准确的人格描述。当用户要求更新、回顾或讨论自己的人格档案时使用；对话过程中自发捕获原始观察。
license: MIT
---

# author

维护一份动态的、持续演进的人格底座（AUTHOR.md）。不是静态用户画像，而是通过观察、记录和蒸馏对话，持续逼近更准确的人格描述。

## 触发边界

### 自动触发

对话过程中，AI 注意到值得记录的认知模式、决策习惯、价值判断时，当场写入 `observations/`。不等会话结束。
用户也可以随时说"记一下" / "capture" 主动触发。

### 用户触发

- "更新人格底座" / "蒸馏" / "distill"
- "回顾最近的观察" / "review observations"
- "写一条反思" / "add reflection"
- 任何涉及 AUTHOR.md 维护、更新、讨论的请求

## 工作流

### 流程一：原始观察捕获（自动 + 用户触发）

```
对话进行中 → 注意到模式 → 对照观察边界 → 写入 observations/<date>-<slug>.md
```

1. 在对话过程中注意用户的认知习惯、决策模式、价值判断
2. 加载 `references/observation-guide.md`，对照观察边界
3. 若有值得记录的模式，当场写入一条原始观察（`status: pending`）
4. 若本次对话无显著新信息，不强行写

### 流程二：蒸馏对话（用户触发）

```
加载 AUTHOR.md + status:pending → 预筛 → 分桶归并 → 逐主题对话 → 写入 AUTHOR.md → 归档
```

1. **加载**：读取 `AUTHOR.md` 和 `references/author-structure.md`，以及所有 status: pending 的观察和反思
2. **预筛**：筛掉明显低价值的观察，标记 `status: skipped`，移入 `archive/`
3. **分桶**：将剩余观察按可引用的共同行为模式归并为候选主题，每个主题标注支撑观察数。每次蒸馏最多讨论 N 个主题，剩余留在 pending 等下次
4. **对话**：加载 `references/distillation-prompt.md`，逐主题展开，每个主题：
   - 陈述观察依据（引用来源文件）
   - 说明与 AUTHOR.md 现有内容的关系（扩展 / 修正 / 新增）
   - 用户当场确认、修正或拒绝
5. **写入**：将所有用户确认的修改写入 AUTHOR.md
6. **归档**：将已消费的观察标记为 `status: archived`，移入 `archive/`

**门控**：所有主题必须经用户逐条确认后才能写入 AUTHOR.md。用户拒绝的建议不写入。

### 流程三：用户反思（用户触发）

引导用户将反思写入 `reflections/` 目录。格式自由，鼓励具体场景 + 自我观察。

## 晋升条件

原始观察满足以下之一才进入 AUTHOR.md：
- 跨场景重复出现 3 次以上
- 用户明确确认
- 用户主动提出

## 输出契约

- AUTHOR.md 每次更新追求精度提高，不追求行数增长
- 每条修改可追溯到具体观察来源
- 未满足晋升条件的观察留在 WARM 层（observations/），不进入 AUTHOR.md
- 蒸馏对话中用户拒绝的建议不写入

## 资源导航

| 路径 | 用途 | 何时加载 |
|------|------|---------|
| `AUTHOR.md` | 人格底座本体 | 蒸馏对话必读 |
| `references/observation-guide.md` | 观察边界、文件格式、好/坏观察示例 | 捕获观察时 |
| `references/distillation-prompt.md` | 蒸馏对话的四阶段流程和关键原则 | 蒸馏对话时 |
| `references/author-structure.md` | AUTHOR.md 十章节哲学层级结构 | 蒸馏对话 + 结构校验时 |
| `observations/` | AI 原始观察（type C） | 蒸馏对话时（仅 status: pending） |
| `reflections/` | 用户反思笔记（type B） | 蒸馏对话时 |
| `evals/` | 触发和工作流评估用例 | 开发验证时 |

## 工具集成

当前支持 Claude Code。Codex CLI 等后续扩展。

### Claude Code

在 `~/.claude/CLAUDE.md` 中添加常驻指令：

```
在对话过程中若观察到值得记录的认知模式，加载 author skill 并按其流程写入观察。
```

author skill 路径通过 SKILL.md 位置相对定位，无需硬编码绝对路径。用户触发词（"蒸馏"、"回顾观察"等）会自动匹配 skill 触发。
