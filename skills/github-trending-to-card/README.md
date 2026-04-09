# GitHub Trending to Card (OpenClaw Skill)

## 🎯 核心目标
将 GitHub 开源趋势数据自动化转化为专供自媒体与内容运营分发的高颜值、高分辨率 PNG 图片。

## 📦 安装 (Install)

```bash
npm install
npx playwright install chromium
```

## ⚙️ 配置 (Configuration)

无需复杂的环境变量配置，所有参数通过入口函数传入即可。
## 🚀 本地运行 (Local Run)

直接运行入口文件测试（会默认抓取 daily 数据并生成 base64 数组长度输出）：

```bash
npx ts-node src/index.ts
```

## 🧪 测试 (Test)

项目使用 Jest 进行单元测试，确保覆盖率达到 80% 以上。

```bash
npm run test
```

门禁测试（包含 lint, type-check, test）：

```bash
npm run precommit
```

## 📦 打包 (Build)

```bash
npm run build
```

## 📤 发布 (Publish)

本模块作为标准的 npm 包或者 Skill Zip 发布：

```bash
npm publish
# 或者通过 OpenClaw 的 Skill 平台打包工具进行打包
```
