[🇨🇳 中文](README.md) | [🇺🇸 English](README.en.md)

---

# 🦾 AI Commit Pro

> 不只是"又一个 AI commit 工具"——而是 **Git 工作流的 AI 增强层**。覆盖从 commit 到 release 的完整文档链。

[![CI](https://github.com/anrune/ai-commit-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/anrune/ai-commit-pro/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/ai-commit-pro.svg)](https://www.npmjs.com/package/ai-commit-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

---

## ✨ 功能

- 🤖 **AI Commit** — 从 staged diff 生成 Conventional Commit message
- 📋 **AI PR** — 从分支 diff 生成 PR 标题 + 正文
- 📝 **AI Changelog** — 从 commit 历史生成结构化 CHANGELOG.md
- 🚀 **AI Release** — 生成 GitHub Release Notes
- 🇨🇳 **国内模型优先** — DeepSeek / 通义千问 / 智谱 GLM / Kimi / 硅基流动
- 🎨 **模板可定制** — Handlebars 模板，团队可统一 prompt 风格
- 🔍 **Provider 自动检测** — 配置好 API Key，自动识别用哪个平台
- 💰 **成本透明** — 每次调用显示 token 消耗和费用

---

## 📸 演示

```bash
$ git add src/
$ ai-commit --lang zh

✔ Found staged changes on branch feat/dark-mode (42 lines)
✔ Generated in 1.4s

────────────────────────────────────────────────────────────
feat(theme): 新增深色模式，支持系统偏好自动检测

- 新增 ThemeProvider，支持 light/dark/system 三种模式
- 用 CSS 变量替换硬编码颜色，实现主题切换
- 用户偏好持久化到 localStorage
────────────────────────────────────────────────────────────
Tokens: 1333 in + 21 out  |  Cost: $0.0002

Commit with this message? [Y/n/e] y
✔ Committed to feat/dark-mode 🎉
```

<!-- TODO: 录制终端 GIF 替换上面的文字演示 -->

---

## 🚀 快速开始

```bash
# 安装
npm install -g ai-commit-pro

# 配置 API Key（推荐 DeepSeek，极低成本）
export DEEPSEEK_API_KEY=sk-xxx

# 暂存修改
git add .

# 生成 commit
ai-commit
```

> 💡 不需要指定 provider —— ai-commit 自动检测你配了哪个 API Key。

---

## 📖 使用

### Commit（`ai-commit`）

```bash
ai-commit                  # 从 staged diff 生成 commit message
ai-commit --dry-run        # 预览，不执行提交
ai-commit --yes            # 跳过确认，直接提交
ai-commit --lang zh        # 中文 commit message
ai-commit --provider deepseek  # 指定 Provider
ai-commit --model deepseek-v4-flash  # 指定模型
```

### PR（`ai-commit pr`）

```bash
ai-commit pr                          # 生成 PR 描述（对比 main）
ai-commit pr --target develop         # 指定目标分支
ai-commit pr --dry-run                # 仅预览
```

### Changelog（`ai-commit changelog`）

```bash
ai-commit changelog                          # 从最近 50 条 commit 生成
ai-commit changelog --from v1.0.0 --to HEAD  # 指定范围
ai-commit changelog --output CHANGELOG.md     # 写入文件
```

### Release（`ai-commit release`）

```bash
ai-commit release --from v1.0.0 --release-version v1.1.0  # 生成 Release Notes
```

### Providers（`ai-commit providers`）

```bash
ai-commit providers  # 列出所有支持的模型平台
```

---

## 🔧 配置

### 方式 1：环境变量

**macOS / Linux：**

```bash
export DEEPSEEK_API_KEY=sk-xxx       # DeepSeek（推荐）
export DASHSCOPE_API_KEY=sk-xxx      # 通义千问
export ZHIPU_API_KEY=xxx             # 智谱 GLM
export MOONSHOT_API_KEY=sk-xxx       # Kimi
export SILICONFLOW_API_KEY=sk-xxx    # 硅基流动

```

**Windows PowerShell：**

```powershell
$env:DEEPSEEK_API_KEY = "sk-xxx"     # DeepSeek（推荐）
$env:DASHSCOPE_API_KEY = "sk-xxx"    # 通义千问
$env:ZHIPU_API_KEY = "xxx"           # 智谱 GLM
$env:MOONSHOT_API_KEY = "sk-xxx"     # Kimi
$env:SILICONFLOW_API_KEY = "sk-xxx"  # 硅基流动
```

```

> 💡 不需要配 `AI_COMMIT_PROVIDER`，配好 Key 后自动检测。

### 方式 2：配置文件

在项目根目录创建 `.ai-commit.yml`：

```yaml
provider: deepseek
apiKey: sk-xxx
model: deepseek-v4-flash
lang: zh
```

支持格式：`.ai-commit.yml`、`.ai-commit.json`、`.ai-commitrc`、`ai-commit.config.js`

### 方式 3：自定义 Prompt 模板

```bash
mkdir -p .ai-commit/templates
cp node_modules/ai-commit-pro/dist/templates/commit.hbs .ai-commit/templates/
# 编辑后立即生效
```

---

## 📦 支持的模型

### 🇨🇳 国内

| Provider | 模型 | 价格 | 注册 |
|----------|------|------|------|
| **DeepSeek** ⭐ | deepseek-v4-flash | ¥1/M 入 · ¥2/M 出 | [platform.deepseek.com](https://platform.deepseek.com/) |
| 通义千问 | qwen-plus | ¥0.8/M 入 · ¥2/M 出 | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/) |
| 智谱 GLM | glm-4-flash | ¥0 入 · ¥0 出 | [open.bigmodel.cn](https://open.bigmodel.cn/) |
| Kimi | kimi-k2.5 | ¥1.4/M 入 · ¥14/M 出 | [platform.moonshot.cn](https://platform.moonshot.cn/) |
| 硅基流动 | Qwen3-235B-A22B | ¥2/M 入 · ¥6/M 出 | [cloud.siliconflow.cn](https://cloud.siliconflow.cn/) |

> 💡 **注意**：DeepSeek 的 `deepseek-chat` 已于 2026-07-24 废弃，默认模型已切换为 `deepseek-v4-flash`。

> 💡 **推荐组合**：日常用 DeepSeek（极低成本 + 效果好），偶尔切通义千问或智谱 GLM 作为补充。



## 🗺️ 路线图

- [x] `ai-commit` — 提交信息生成
- [x] `ai-commit pr` — PR 描述生成
- [x] `ai-commit changelog` — 变更日志生成
- [x] `ai-commit release` — 发布说明生成
- [x] `ai-commit providers` — 列出模型平台
- [x] 🇨🇳 国内模型支持（DeepSeek, 通义千问, GLM, Kimi, 硅基流动）
- [x] 🇨🇳 中文 commit message 输出
- [ ] 编辑器模式 — 提交前手动编辑 message
- [ ] GitHub CLI 集成 — `--create` 直接创建 PR/Release
- [ ] Git hooks — `prepare-commit-msg` hook 集成
- [ ] 团队配置 — 共享 `.ai-commit.yml` 模板

---

## 🤝 贡献

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 开源协议

MIT © [anrune](https://github.com/anrune)
