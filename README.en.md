[🇨🇳 中文](README.md) | [🇺🇸 English](README.en.md)

---

# 🦾 AI Commit Pro

> Not just another AI commit tool — an **AI enhancement layer for your Git workflow**. Covers the entire documentation chain from commit to release.

[![CI](https://github.com/anrune/ai-commit-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/anrune/ai-commit-pro/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/ai-commit-pro.svg)](https://www.npmjs.com/package/ai-commit-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

---

## ✨ Features

- 🤖 **AI Commit** — Generate Conventional Commit messages from staged diffs
- 📋 **AI PR** — Generate PR title + description from branch diff
- 📝 **AI Changelog** — Generate structured CHANGELOG.md from commit history
- 🚀 **AI Release** — Generate GitHub Release Notes
- 🇨🇳 **Chinese Providers** — DeepSeek / Qwen / GLM / Kimi / SiliconFlow
- 🎨 **Custom Templates** — Handlebars templates for team-wide consistency
- 🔍 **Auto-Detection** — Set any API key, provider is detected automatically
- 💰 **Cost Transparency** — Token usage and cost shown with every call

---

## 📸 Demo

```bash
$ git add src/
$ ai-commit

✔ Found staged changes on branch feat/dark-mode (42 lines)
✔ Generated in 1.4s

────────────────────────────────────────────────────────────
feat(theme): add dark mode support with system preference detection

- Add ThemeProvider component with light/dark/system modes
- Implement CSS variables for color scheme switching
- Add localStorage persistence for user preference
────────────────────────────────────────────────────────────
Tokens: 1333 in + 21 out  |  Cost: $0.0002

Commit with this message? [Y/n/e] y
✔ Committed to feat/dark-mode 🎉
```

<!-- TODO: replace with terminal GIF demo -->

---

## 🚀 Quick Start

```bash
# Install
npm install -g ai-commit-pro

# Set API key (macOS / Linux)
export DEEPSEEK_API_KEY=sk-xxx

# Or Windows PowerShell (run once, permanent):
# [Environment]::SetEnvironmentVariable('DEEPSEEK_API_KEY', 'sk-xxx', 'User')

# Stage and commit
git add .
ai-commit
```

> 💡 No need to specify a provider — ai-commit auto-detects which API key you've set.

---

## 📖 Usage

### Commit (`ai-commit` / `ai-commit c`)

```bash
ai-commit                  # Generate commit message from staged diff
ai-commit -a               # Auto git add -A before generating
ai-commit --dry-run        # Preview without committing
ai-commit --yes            # Skip confirmation
ai-commit --lang zh        # Output in Chinese
ai-commit --provider deepseek  # Override provider
ai-commit --model deepseek-v4-flash  # Override model
```

### PR (`ai-commit pr` / `ai-commit p`)

```bash
ai-commit pr                          # Generate PR description (vs main)
ai-commit pr --lang zh                # Chinese PR description
ai-commit pr --target develop         # Specify target branch
ai-commit pr --model deepseek-v4-flash  # Override model
ai-commit pr --dry-run                # Preview only
```

### Changelog (`ai-commit changelog` / `ai-commit cl`)

```bash
ai-commit changelog                          # From last 50 commits
ai-commit changelog --lang zh                # Chinese CHANGELOG
ai-commit changelog --from v1.0.0 --to HEAD  # Specify range
ai-commit changelog --output CHANGELOG.md     # Write to file
ai-commit changelog --output CHANGELOG.md --append  # Append to existing file
```

### Release (`ai-commit release` / `ai-commit r`)

```bash
ai-commit release --from v1.0.0 --release-version v1.1.0  # Generate Release Notes
ai-commit release --from v1.0.0 --release-version v1.1.0 --lang zh  # Chinese Release Notes
ai-commit release --from v1.0.0 --release-version v1.1.0 --lang zh --publish  # Generate + publish to GitHub
ai-commit release --from v1.0.0 --to v1.0.5 --release-version v1.1.0  # Specify end range
```

### Providers (`ai-commit providers` / `ai-commit ls`)

```bash
ai-commit providers  # List all supported platforms with pricing and default models
```

---

## 🔧 Configuration

### Environment Variables

**macOS / Linux:**

```bash
export DEEPSEEK_API_KEY=sk-xxx       # DeepSeek (recommended)
export DASHSCOPE_API_KEY=sk-xxx      # Qwen
export ZHIPU_API_KEY=xxx             # GLM
export MOONSHOT_API_KEY=sk-xxx       # Kimi
export SILICONFLOW_API_KEY=sk-xxx    # SiliconFlow
```

**Windows PowerShell (run once, persists permanently):**

```powershell
[Environment]::SetEnvironmentVariable('DEEPSEEK_API_KEY', 'sk-xxx', 'User')     # DeepSeek (recommended)
[Environment]::SetEnvironmentVariable('DASHSCOPE_API_KEY', 'sk-xxx', 'User')    # Qwen
[Environment]::SetEnvironmentVariable('ZHIPU_API_KEY', 'xxx', 'User')           # GLM
[Environment]::SetEnvironmentVariable('MOONSHOT_API_KEY', 'sk-xxx', 'User')     # Kimi
[Environment]::SetEnvironmentVariable('SILICONFLOW_API_KEY', 'sk-xxx', 'User')  # SiliconFlow
```

> ⚠️ Restart your terminal (or IDE) after setting for changes to take effect.

### Config File

Create `.ai-commit.yml` in your project root:

```yaml
provider: deepseek
apiKey: sk-xxx
model: deepseek-v4-flash
lang: zh
```

Supported formats: `.ai-commit.yml`, `.ai-commit.json`, `.ai-commitrc`, `ai-commit.config.js`

### Custom Prompt Templates

```bash
mkdir -p .ai-commit/templates
cp node_modules/ai-commit-pro/dist/templates/commit.hbs .ai-commit/templates/
# Edit to match your team's conventions — takes effect immediately
```

Templates use Handlebars syntax. Separate system and user prompts with `---USER---`.

---

## 📦 Supported Models

### 🇨🇳 China

| Provider | Model | Pricing | Sign Up |
|----------|-------|---------|---------|
| **DeepSeek** ⭐ | deepseek-v4-flash | ¥1/M in · ¥2/M out | [platform.deepseek.com](https://platform.deepseek.com/) |
| Qwen | qwen-plus | ¥0.8/M in · ¥2/M out | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/) |
| GLM | glm-4-flash | ¥0 / ¥0 | [open.bigmodel.cn](https://open.bigmodel.cn/) |
| Kimi | kimi-k2.5 | ¥1.4/M in · ¥14/M out | [platform.moonshot.cn](https://platform.moonshot.cn/) |
| SiliconFlow | Qwen3-235B-A22B | ¥2/M in · ¥6/M out | [cloud.siliconflow.cn](https://cloud.siliconflow.cn/) |

> 💡 **Note**: DeepSeek's `deepseek-chat` was deprecated on 2026-07-24. Default model has been switched to `deepseek-v4-flash`.

> 💡 **Recommendation**: DeepSeek for daily use (ultra-low cost, great quality). Switch to Qwen or GLM as needed.

---

## 🗺️ Roadmap

### Completed

- [x] Commit, PR, Changelog, Release generation
- [x] Chinese providers (DeepSeek, Qwen, GLM, Kimi, SiliconFlow)
- [x] Chinese language output for all commands
- [x] Editor mode — press `e` to edit message before committing
- [x] `--all` auto-staging — `-a` runs `git add -A`
- [x] Scope auto-detection from changed file paths
- [x] Detailed commit body with bullet points
- [x] Release `--publish` — one-click GitHub Release creation
- [x] API key setup guide in `--help` (Windows/macOS/Linux)

### High Priority

- [ ] **Native Claude support** — Anthropic SDK integration for higher quality messages
- [ ] **pr --publish** — direct `gh pr create` from CLI

### Medium Priority

- [ ] **prepare-commit-msg hook** — auto-generate on any `git commit`
- [ ] **Custom Provider** — any OpenAI-compatible endpoint (Ollama, proxies, etc.)
- [ ] **Retry / switch model** — press `r` to regenerate, switch providers on the fly
- [ ] **Multi-model compare** — `ai-commit --compare` to pick the best result
- [ ] **Changelog cache** — cache results for the same commit range

### Low Priority

- [ ] **Interactive wizard** — `--wizard` step-by-step commit crafting
- [ ] **Post-commit actions** — `--push` auto-push, `--pr` auto-open PR
- [ ] **Emoji support** — gitmoji style (`✨ feat:`, `🐛 fix:`)
- [ ] **Pre-commit lint** — `--lint` validate against Conventional Commits spec

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT © [anrune](https://github.com/anrune)
