#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { commitCommand } from './commands/commit.js';
import { prCommand } from './commands/pr.js';
import { changelogCommand } from './commands/changelog.js';
import { releaseCommand } from './commands/release.js';

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
  ai-commit                Generate a commit message from staged changes
  ai-commit pr             Generate a PR description from branch diff
  ai-commit changelog      Generate CHANGELOG.md from commit history
  ai-commit release        Generate GitHub Release Notes

🔧 Configuration:
  Set your API key via environment variable:
    export DEEPSEEK_API_KEY=sk-xxx      # DeepSeek (国内推荐)
    export ANTHROPIC_API_KEY=sk-ant-xxx # Claude
    export OPENAI_API_KEY=sk-xxx        # GPT

  Or create a config file (.ai-commit.yml):
    provider: deepseek
    apiKey: sk-xxx

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

// ── 智能路由：无子命令时自动走 commit ──
const KNOWN = ['commit', 'c', 'pr', 'p', 'changelog', 'cl', 'release', 'r',
               'help', '-h', '--help', '-v', '--version'];
const args = process.argv.slice(2);
const hasSubcommand = args.length > 0 && KNOWN.includes(args[0]);

if (!hasSubcommand) {
  // 直接把参数传给 commit 命令执行
  await commitCommand.parseAsync([...args], { from: 'user' });
} else {
  program.parse();
}
