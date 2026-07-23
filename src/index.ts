#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
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
    export ANTHROPIC_API_KEY=sk-ant-xxx   # for Claude
    export OPENAI_API_KEY=sk-xxx          # for GPT

  Or create a config file (.ai-commit.yml):
    provider: anthropic
    apiKey: sk-ant-xxx

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

// 默认行为 → 执行 commit 命令
program.action(() => {
  // 当没有子命令匹配时，执行 commit
  commitCommand.parse([...process.argv.slice(2)]);
});

program.parse();
