# author 技能安装与 Hook 集成讨论

**日期**：2026-04-30
**参与者**：linzhikai + Claude Code
**状态**：已完成

---

## 已决策

### 1. 会话结束自动捕获不可靠 → 选 C：AI 会话内主动记 + 用户主动触发

放弃依赖 Stop hook。AI 在对话进行中注意到值得记录的模式就当场写观察，不等会话结束。
用户也可以随时说"记一下"/"capture"主动触发。

### 2. 边聊边记产出格式 = 同现有 observation 格式

独立 markdown 文件，`status: pending`，落入 `observations/`。和蒸馏流程完全兼容。

### 3. 触发阈值 → 偏 B：宁可多记，蒸馏时再过滤

偏低阈值，AI 觉得"可能有用"就记。不要求 AI 运行时判断跨场景重复（这要求记住之前会话的观察）。

### 4. 信噪比控制 → 选 B：AI 预筛

蒸馏时 AI 筛掉明显低价值的观察（标记 `status: skipped`，归档）。
实行分桶 + 限量 + 渐进合并：每次蒸馏最多讨论 N 个主题，剩余留在 pending 等下次。

### 5. 分桶逻辑位置 → prompt + references 都要

prompt 写流程，references/ 写规则。

---

### 6. 合并逻辑粒度 → 可引用的共同行为模式

不靠语义联想，不靠死板关键字匹配。三条观察合并必须共享一个可观察的行为模式（如"先追问前提再讨论方案"），每个合并主题都能追溯到各自的观察文件。用户在蒸馏对话中能快速验证。

### 7. 跨工具安装 → 先只支持 Claude Code

- Codex CLI / Gemini CLI 后续扩展
- 常驻指令写入 `~/.claude/CLAUDE.md`，非项目级
- author 路径通过 SKILL.md 位置相对定位，不硬编码绝对路径（通过 npx skills 安装后自动定位）
- 覆盖两个触发场景：边聊边记（对话中自发捕获）+ 蒸馏/回顾（用户触发词）
- Codex CLI 参考：项目指令用 `AGENTS.md`，全局用 `~/.codex/AGENTS.md`，hooks 用 `hooks.json` 或 `config.toml` 内联。未来扩展时在 `~/.codex/AGENTS.md` 加等效指令即可
