#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { commitCommand } from './commands/commit.js';
import { prCommand } from './commands/pr.js';
import { changelogCommand } from './commands/changelog.js';
import { releaseCommand } from './commands/release.js';
import { providersCommand } from './commands/providers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 package.json 获取版本号
const pkgPath = join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const program = new Command();

program
  .name('ai-commit')
  .description(
    '🦾 AI Commit Pro — AI-powered Git workflow assistant\n' +
    '  commit | pr | changelog | release',
  )
  .version(pkg.version, '-v, --version', 'Show version number')
  .addHelpText(
    'after',
    `
📋 Quick Start:
  ai-commit                         Generate a commit message from staged changes
  ai-commit commit -a               Stage all changes + generate message
  ai-commit pr                       Generate a PR description from branch diff
  ai-commit changelog                Generate CHANGELOG.md from commit history
  ai-commit release                  Generate GitHub Release Notes
  ai-commit providers                List all supported LLM providers

🔑 API Key (one-time setup — survives terminal restart):

  ── Windows (PowerShell, run once as regular user) ──
  [Environment]::SetEnvironmentVariable('DEEPSEEK_API_KEY', 'sk-xxx', 'User')
  [Environment]::SetEnvironmentVariable('DASHSCOPE_API_KEY', 'sk-xxx', 'User')
  [Environment]::SetEnvironmentVariable('ZHIPU_API_KEY', 'xxx', 'User')

  ── macOS / Linux (add to ~/.zshrc or ~/.bashrc) ──
  export DEEPSEEK_API_KEY=sk-xxx      # DeepSeek（推荐）
  export DASHSCOPE_API_KEY=sk-xxx     # 通义千问
  export ZHIPU_API_KEY=xxx            # 智谱 GLM
  export MOONSHOT_API_KEY=sk-xxx      # Kimi
  export SILICONFLOW_API_KEY=sk-xxx   # SiliconFlow

  ── Or use a config file (.ai-commit.yml) ──
  provider: deepseek
  apiKey: sk-xxx

  After setting, RESTART your terminal/IDE to pick up the new variable.
  Verify: echo $env:DEEPSEEK_API_KEY  (Windows)  or  echo $DEEPSEEK_API_KEY  (Unix)

💡 Tips:
  • Press 'e' at the [Y/n/e] prompt to edit the commit message in your editor
  • Default provider is DeepSeek (cheapest). Other providers auto-detected by which key is set.
  • Run ai-commit providers to see all supported models and their pricing.

📦 Resources:
  GitHub: https://github.com/anrune/ai-commit-pro
  Issues: https://github.com/anrune/ai-commit-pro/issues
`,
  );

// 注册子命令
program.addCommand(commitCommand);
program.addCommand(prCommand);
program.addCommand(changelogCommand);
program.addCommand(releaseCommand);
program.addCommand(providersCommand);

// ── 智能路由：无子命令时自动走 commit ──
const KNOWN = ['commit', 'c', 'pr', 'p', 'changelog', 'cl', 'release', 'r',
               'providers', 'ls', 'help', '-h', '--help', '-v', '--version'];
const args = process.argv.slice(2);
const hasSubcommand = args.length > 0 && KNOWN.includes(args[0]);

if (!hasSubcommand) {
  // 直接把参数传给 commit 命令执行
  await commitCommand.parseAsync([...args], { from: 'user' });
} else {
  program.parse();
}
