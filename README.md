# 🦾 AI Commit Pro

> 不只是"又一个 AI commit 工具"——而是 **Git 工作流的 AI 增强层**。  
> 覆盖从 commit 到 release 的完整文档链。

[![CI](https://github.com/anrune/ai-commit-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/anrune/ai-commit-pro/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

## ✨ Features

- 🤖 **AI Commit** — 从 staged diff 生成 Conventional Commit message
- 📋 **AI PR** — 从分支 diff 生成 PR 标题 + 正文
- 📝 **AI Changelog** — 从 commit 历史生成结构化 CHANGELOG.md
- 🚀 **AI Release** — 生成 GitHub Release Notes
- 🎨 **自定义模板** — 通过 Handlebars 模板自定义 prompt
- 🔌 **多 Provider** — 国外 Anthropic/OpenAI + 国内 DeepSeek/通义千问/智谱/Kimi/硅基流动
- 💰 **成本透明** — 显示每次调用的 token 消耗和费用

## 📸 Demo

<!-- TODO: 录制终端 GIF -->

```bash
$ git add src/
$ ai-commit

Reading changes... ✓ Found staged changes on branch feat/new-parser (42 lines)
AI is analyzing your changes... ✓ Generated in 1.8s

────────────────────────────────────────────────────────────
feat(parser): add streaming JSON parser with error recovery

Implement a new JSON parser that supports incremental parsing
and can recover from common syntax errors. The parser emits
tokens as they become available rather than waiting for the
complete input.

BREAKING CHANGE: Parser API now returns AsyncIterator instead
of the previous callback-based interface.
────────────────────────────────────────────────────────────
Tokens: 320 in + 89 out  |  Cost: $0.0023

Commit with this message? [Y/n/e] (y=commit, n=cancel, e=open editor to edit): y
✓ Committed to feat/new-parser 🎉
```

## 🚀 Quick Start

```bash
# 安装
npm install -g ai-commit-pro

# 配置 API Key（二选一，国内用户推荐 DeepSeek）
export DEEPSEEK_API_KEY=sk-xxx       # DeepSeek 极低成本，国内首选
# export ANTHROPIC_API_KEY=sk-ant-xxx  # Claude 最佳效果
# export DASHSCOPE_API_KEY=sk-xxx      # 通义千问

# 暂存修改
git add .

# 生成 commit
ai-commit
```

## 📖 Usage

### Commit (`ai-commit`)

```bash
ai-commit                  # 从 staged diff 生成 commit message
ai-commit --dry-run        # 预览，不执行提交
ai-commit --yes            # 跳过确认，直接提交
ai-commit --all            # 自动 stage 所有修改
ai-commit --lang zh        # 生成中文 commit message
ai-commit --model gpt-4o   # 指定模型
```

### PR (`ai-commit pr`)

```bash
ai-commit pr                          # 生成 PR（对比 main）
ai-commit pr --target develop         # 指定目标分支
ai-commit pr --dry-run                # 仅预览
```

### Changelog (`ai-commit changelog`)

```bash
ai-commit changelog                          # 从最近 50 条 commit 生成
ai-commit changelog --from v1.0.0 --to HEAD  # 指定范围
ai-commit changelog --output CHANGELOG.md     # 写入文件
ai-commit changelog --append                  # 追加到已有文件
```

### Release (`ai-commit release`)

```bash
ai-commit release --from v1.0.0 --version v1.1.0   # 生成 Release Notes
ai-commit release --from v1.0.0 --publish           # 配合 gh CLI 发布
```

## 🔧 Configuration

### 方式 1：环境变量

```bash
# 国内推荐
export DEEPSEEK_API_KEY=sk-xxx        # DeepSeek 极低成本
export AI_COMMIT_PROVIDER=deepseek
export AI_COMMIT_LANG=zh

# 也可以
export DASHSCOPE_API_KEY=sk-xxx       # 通义千问
export ZHIPU_API_KEY=xxx              # 智谱 GLM
export MOONSHOT_API_KEY=sk-xxx        # Kimi
export SILICONFLOW_API_KEY=sk-xxx     # 硅基流动

# 国外
export ANTHROPIC_API_KEY=sk-ant-xxx   # Claude
export OPENAI_API_KEY=sk-xxx          # GPT
```

> 💡 **不需要指定 provider** —— ai-commit 会自动检测你配置了哪个 API Key。

### 方式 2：配置文件

在项目根目录创建 `.ai-commit.yml`：

```yaml
# 国内推荐 DeepSeek
provider: deepseek
apiKey: sk-xxx
model: deepseek-chat
lang: zh

# 或用通义千问
# provider: qwen
# apiKey: sk-xxx
# model: qwen-plus
```

支持的配置文件格式：`.ai-commit.yml`、`.ai-commit.json`、`.ai-commitrc`、`ai-commit.config.js`

### 方式 3：自定义 Prompt 模板

```bash
mkdir -p .ai-commit/templates

# 复制内置模板进行修改
cp node_modules/ai-commit-pro/dist/templates/commit.hbs .ai-commit/templates/
# 编辑 .ai-commit/templates/commit.hbs 后即可生效
```

## 📦 Supported Models

### 🌍 国际

| Provider  | Model             | Input $/1M tok | Output $/1M tok | 特点 |
|-----------|-------------------|----------------|-----------------|------|
| Anthropic | claude-sonnet-4-6 | $3.00          | $15.00          | 最佳代码理解 |
| Anthropic | claude-haiku-4-5  | $0.80          | $4.00           | 快速便宜 |
| OpenAI    | gpt-4o            | $2.50          | $10.00          | 综合能力强 |
| OpenAI    | gpt-4o-mini       | $0.15          | $0.60           | 极低成本 |

### 🇨🇳 国内

| Provider     | Model                 | Input ¥/1M tok | Output ¥/1M tok | 注册地址 |
|-------------|----------------------|----------------|-----------------|----------|
| DeepSeek    | deepseek-chat         | ¥1             | ¥2              | [platform.deepseek.com](https://platform.deepseek.com/) |
| 通义千问     | qwen-plus             | ¥4             | ¥16             | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/) |
| 智谱 GLM    | glm-4-flash           | 免费           | 免费             | [open.bigmodel.cn](https://open.bigmodel.cn/) |
| Kimi        | moonshot-v1-8k        | ¥12            | ¥36             | [platform.moonshot.cn](https://platform.moonshot.cn/) |
| 硅基流动     | Qwen3-235B-A22B       | ¥2             | ¥6              | [cloud.siliconflow.cn](https://cloud.siliconflow.cn/) |

> 💡 **推荐**：日常用 **DeepSeek**（便宜且效果好），需要最佳质量用 **Claude Sonnet**。
> 智谱 GLM-4-Flash 完全免费，适合入门体验。

## 🗺️ Roadmap

- [x] `ai-commit` — Commit message generation
- [x] `ai-commit pr` — PR description generation
- [x] `ai-commit changelog` — Changelog generation
- [x] `ai-commit release` — Release notes generation
- [ ] Editor mode for message editing before commit
- [ ] GitHub CLI integration (auto-create PR/release)
- [ ] Git hooks integration (prepare-commit-msg)
- [ ] Multi-language output support
- [ ] Custom Conventional Commit presets

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT © [anrune](https://github.com/anrune)
