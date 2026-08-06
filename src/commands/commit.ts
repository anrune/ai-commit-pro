import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir, platform } from 'os';
import { join } from 'path';
import { GitReader } from '../core/git-reader.js';
import { LLMClient } from '../core/llm-client.js';
import { PromptEngine } from '../core/prompt-engine.js';
import { Formatter } from '../core/formatter.js';
import { loadConfig, checkApiKey } from '../config/loader.js';

const fmt = new Formatter();

export const commitCommand = new Command('commit')
  .alias('c')
  .description('Generate a Conventional Commit message from staged changes')
  .option('-d, --dry-run', 'Show the generated message without committing')
  .option('-m, --model <model>', 'Override the LLM model')
  .option('-p, --provider <provider>', 'Override the LLM provider (deepseek/qwen/zhipu/moonshot/siliconflow)')
  .option('-l, --lang <lang>', 'Commit message language (en/zh)', 'en')
  .option('-a, --all', 'Include unstaged changes (git add -A)')
  .option('-y, --yes', 'Skip confirmation and commit immediately')
  .action(async (options) => {
    const spinner = ora();

    try {
      // ── 1. 环境检查 ──
      const git = new GitReader();

      if (!(await git.isRepo())) {
        console.log(fmt.error('Not a git repository. Run this command inside a git repo.'));
        process.exit(1);
      }

      // ── 2. 加载配置 ──
      const config = await loadConfig();
      const keyCheck = checkApiKey(config);
      if (!keyCheck.ok) {
        console.log(fmt.error(keyCheck.message));
        process.exit(1);
      }

      // ── 3. 暂存变更（如果指定了 -a） ──
      if (options.all) {
        spinner.start('Staging all changes...');
        await git.stageAll();
        spinner.succeed('All changes staged');
      }

      // ── 4. 读取 diff ──
      spinner.start('Reading changes...');
      const [diff, stagedFiles] = await Promise.all([
        git.getStagedDiff(),
        git.getStagedFiles(),
      ]);

      if (!diff.trim()) {
        spinner.fail('No staged changes found.');
        console.log(
          chalk.dim('\n  Tip: Use `git add <files>` or run with -a to auto-stage all changes.'),
        );
        process.exit(1);
      }

      const branchName = await git.getCurrentBranch();
      const suggestedScope = detectScope(stagedFiles);
      spinner.succeed(
        `Found staged changes on branch ${chalk.cyan(branchName)} (${diff.split('\n').length} lines)` +
          (suggestedScope ? chalk.dim(` — scope: ${suggestedScope}`) : ''),
      );

      // ── 5. 调用 LLM ──
      spinner.start('AI is analyzing your changes...');
      spinner.color = 'yellow';

      const llm = new LLMClient({
        provider: (options.provider as any) || config.provider || 'deepseek',
        apiKey: config.apiKey!,
        model: options.model || config.model,
        maxTokens: config.maxTokens,
      });

      const prompt = new PromptEngine(config.templatesDir);
      const { system, user } = await prompt.render('commit', {
        diff,
        branchName,
        repoInfo: await git.getRepoInfo(),
        extra: { lang: options.lang || 'en' },
        suggestedScope: suggestedScope || undefined,
      });

      const startTime = Date.now();
      const response = await llm.chat(system, user);
      const elapsed = Date.now() - startTime;

      spinner.succeed(`Generated in ${(elapsed / 1000).toFixed(1)}s`);

      // ── 6. 展示结果 ──
      console.log('');
      console.log(fmt.divider());
      console.log(fmt.formatCommitMessage(response.text));
      console.log(fmt.divider());
      console.log(fmt.formatUsage(response.usage.inputTokens, response.usage.outputTokens, response.usage.cost));
      console.log('');

      // ── 7. 确认 & 提交 ──
      if (options.dryRun) {
        console.log(chalk.dim('(Dry run — nothing was committed)'));
        return;
      }

      let message = response.text.trim();
      const action = options.yes ? 'yes' : await _confirmCommit();

      if (action === 'edit') {
        const edited = await _openEditor(message);
        if (edited && edited.trim()) {
          message = edited.trim();
          console.log(chalk.dim('\nUpdated message:'));
          console.log(fmt.formatCommitMessage(message));
        } else {
          console.log(chalk.yellow('Editor returned empty message. Commit cancelled.'));
          return;
        }
      } else if (action === 'cancel') {
        console.log(chalk.yellow('Commit cancelled.'));
        return;
      }

      spinner.start('Committing...');
      await git.commit(message);
      spinner.succeed(`Committed to ${chalk.cyan(branchName)} 🎉`);
    } catch (error: any) {
      spinner.stop();
      console.log(fmt.error(error.message));

      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        console.log(chalk.dim('\n  Check your API key configuration.'));
      }

      process.exit(1);
    }
  });

// ── 交互式确认（返回 'yes' | 'cancel' | 'edit'） ──

async function _confirmCommit(): Promise<'yes' | 'cancel' | 'edit'> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.yellow('\nCommit with this message? [Y/n/e] ') +
        chalk.dim('(y=commit, n=cancel, e=open editor to edit): '),
      (answer) => {
        rl.close();
        const a = answer.toLowerCase().trim();

        if (a === 'e') return resolve('edit');
        if (a === 'n') return resolve('cancel');
        // 默认（直接回车或 y）→ 确认提交
        resolve('yes');
      },
    );
  });
}

// ── 根据变更文件路径推断 scope ──

/** 不算 scope 的"容器"目录——跳过它们取下一级 */
const SKIP_DIRS = new Set([
  'src', 'lib', 'pkg', 'internal', 'cmd', 'app',
  'test', 'tests', '__tests__', 'spec', '__spec__',
  'docs', 'doc', 'scripts', 'config', 'build', 'ci',
  '.github', '.husky', 'dist', 'out', 'target', 'node_modules',
]);

function detectScope(files: string[]): string | null {
  if (files.length === 0) return null;

  // 提取每个文件的"第一个有意义目录"；扁平结构则用文件名（去扩展名）
  const scopes = files.map((f) => {
    const parts = f.replace(/\\/g, '/').split('/');
    const fileName = parts[parts.length - 1].replace(/\.[^/.]+$/, '');

    // 跳过容器目录，取第一个有意义的
    for (let i = 0; i < parts.length - 1; i++) {
      if (!SKIP_DIRS.has(parts[i])) return parts[i];
    }
    // 所有目录都是容器（如 src/user.ts）→ 用文件名
    if (parts.length > 1) return fileName;
    // 根目录文件（如 package.json）→ 用文件名
    return fileName;
  });

  const valid = scopes.filter(Boolean) as string[];
  if (valid.length === 0) return null;

  // 统计频率
  const freq = new Map<string, number>();
  for (const s of valid) {
    freq.set(s, (freq.get(s) || 0) + 1);
  }

  // 找到出现次数最多的
  let best = '';
  let bestCount = 0;
  for (const [scope, count] of freq) {
    if (count > bestCount) {
      bestCount = count;
      best = scope;
    }
  }

  // 超过半数文件属于同一 scope 才采用，否则不瞎猜
  if (bestCount > valid.length / 2) return best;
  return null;
}

// ── 打开编辑器让用户修改 message ──

async function _openEditor(initialMessage: string): Promise<string | null> {
  // 写入临时文件
  const tmpFile = join(tmpdir(), `ai-commit-msg-${Date.now()}.txt`);
  writeFileSync(tmpFile, initialMessage + '\n\n# Edit the commit message above. Save and close to confirm.\n# Lines starting with # will be removed.', 'utf-8');

  // 获取编辑器：优先 git core.editor，其次 $EDITOR，Windows 兜底 notepad
  let editor: string;
  try {
    editor = execSync('git config core.editor', { encoding: 'utf-8' }).trim();
  } catch {
    editor = '';
  }
  if (!editor) {
    editor = process.env.EDITOR || process.env.VISUAL || '';
  }
  if (!editor) {
    editor = platform() === 'win32' ? 'notepad' : 'vi';
  }

  console.log(chalk.dim(`\nOpening ${editor} to edit the message...`));

  try {
    // 同步等待编辑器关闭
    const cmd = editor.includes('code')
      ? `${editor} --wait "${tmpFile}"`
      : `${editor} "${tmpFile}"`;

    execSync(cmd, { stdio: 'inherit' });

    // 读取修改后的内容，去掉注释行
    const content = readFileSync(tmpFile, 'utf-8');
    const lines = content
      .split('\n')
      .filter(line => !line.startsWith('#'))
      .join('\n');

    return lines.trim();
  } catch (err) {
    console.log(chalk.red(`\nEditor failed: ${err}`));
    return null;
  } finally {
    // 清理临时文件
    try { unlinkSync(tmpFile); } catch {}
  }
}
