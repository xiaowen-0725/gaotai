# 稿台

V1：在 Board 中收集 file、阅读并高亮，用 Task chat 消化原料，再经 Write 按体裁生成彼此独立的中文文档。

默认模型由环境变量 `GAOTAI_DEFAULT_MODEL`（或 `DEFAULT_MODEL`）指定，界面不展示模型品牌。

## How to run

- unit: `npm test`
- acceptance (gaotai-v1.feature): `npm run acceptance`

首次需要 `npm install`，验收会启动 Next.js 并用支持中文 Gherkin 的 Cucumber 跑 `features/gaotai-v1.feature`。
