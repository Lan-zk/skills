# Workflow Evaluation

## Happy Path

### 场景：有 pending 观察，蒸馏成功

1. observations/ 中存在 5 条 status: pending 的观察，其中 2 条属于同一模式（重复 3 次）
2. 用户说"蒸馏"
3. Skill 加载 AUTHOR.md + 5 条观察
4. Skill 分组：识别出 1 个满足晋升条件的主题（3x 重复），2 个不满足的单独主题
5. Skill 按主题顺序展开对话
6. 用户确认第 1 个主题，要求修改措辞
7. 用户接受第 2 个主题的新增建议
8. 用户拒绝第 3 个主题
9. Skill 写入 AUTHOR.md（仅前 2 个主题）
10. 已消费的观察标记为 archived，移入 archive/
11. 被拒绝的观察标记为 archived（附注被拒原因），移入 archive/

**断言**：
- AUTHOR.md 新增内容可追溯到具体观察文件
- 被拒绝的建议未写入 AUTHOR.md
- 所有已消费观察从 observations/ 移出

## Ambiguous Path

### 场景：无 pending 观察

1. observations/ 和 reflections/ 中 status: pending 的文件数为 0
2. 用户说"蒸馏"
3. Skill 报告"当前没有待处理的观察"

**断言**：
- Skill 不强行生成建议
- AUTHOR.md 未被修改

### 场景：观察存在但不满足晋升条件

1. observations/ 中有 3 条观察，但都不满足 3x 重复，用户也未确认
2. 用户说"蒸馏"
3. Skill 展示观察，说明每条都不满足晋升条件
4. 询问用户是否仍要基于某些观察更新

**断言**：
- Skill 不自动晋升不满足条件的观察
- 用户可手动选择晋升

## Failure Path

### 场景：观察全是噪声

1. observations/ 中有 2 条观察，但内容属于"不应记录"类别
2. 用户说"蒸馏"
3. Skill 加载后识别出这些观察不符合记录边界
4. Skill 建议将其标记为 noise 并归档，不用于蒸馏

**断言**：
- 噪声观察不进入 AUTHOR.md
- 噪声观察被标记后移入 archive/

### 场景：AUTHOR.md 不存在

1. author/ 目录存在但 AUTHOR.md 未创建
2. 用户说"蒸馏"
3. Skill 检测到 AUTHOR.md 缺失
4. Skill 基于现有观察和 `references/author-structure.md` 生成初稿
5. 逐章节与用户确认

**断言**：
- 初稿基于实际观察，不凭空编造
- 每个章节经用户确认
- 生成的 AUTHOR.md 符合十章节结构
