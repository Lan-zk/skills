# Trigger Evaluation

## should-trigger

| 输入 | 预期行为 |
|------|---------|
| "更新人格底座" | 触发蒸馏流程 |
| "蒸馏" / "distill" | 触发蒸馏流程 |
| "回顾最近的观察" | 加载并展示 pending 观察 |
| "我想写一条反思" | 引导写入 reflections/ |
| "review my personality profile" | 加载 AUTHOR.md |
| "帮我看看最近有没有什么值得更新的" | 触发蒸馏流程 |

## should-not-trigger

| 输入 | 预期行为 |
|------|---------|
| "帮我写一段代码" | 不触发 |
| "今天的天气怎么样" | 不触发 |
| "翻译这段话" | 不触发 |
| "帮我改个 bug" | 不触发 |
