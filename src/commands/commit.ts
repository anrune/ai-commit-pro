import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
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

      // ── 3. 读取 diff ──
      spinner.start('Reading changes...');
      const diff = await git.getStagedDiff();

      if (!diff.trim()) {
        spinner.fail('No staged changes found.');
        console.log(
          chalk.dim('\n  Tip: Use `git add <files>` or run with -a to auto-stage all changes.'),
        );
        process.exit(1);
      }

      const branchName = await git.getCurrentBranch();
      spinner.succeed(
        `Found staged changes on branch ${chalk.cyan(branchName)} (${diff.split('\n').length} lines)`,
      );

      // ── 4. 调用 LLM ──
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
      });

      const startTime = Date.now();
      const response = await llm.chat(system, user);
      const elapsed = Date.now() - startTime;

      spinner.succeed(`Generated in ${(elapsed / 1000).toFixed(1)}s`);

      // ── 5. 展示结果 ──
      console.log('');
      console.log(fmt.divider());
      console.log(fmt.formatCommitMessage(response.text));
      console.log(fmt.divider());
      console.log(fmt.formatUsage(response.usage.inputTokens, response.usage.outputTokens, response.usage.cost));
      console.log('');

      // ── 6. 确认 & 提交 ──
      if (options.dryRun) {
        console.log(chalk.dim('(Dry run — nothing was committed)'));
        return;
      }

      const message = response.text.trim();
      const shouldCommit = options.yes || (await _confirmCommit(message));

      if (shouldCommit) {
        spinner.start('Committing...');
        await git.commit(message);
        spinner.succeed(`Committed to ${chalk.cyan(branchName)} 🎉`);
      } else {
        console.log(chalk.yellow('Commit cancelled.'));
      }
    } catch (error: any) {
      spinner.stop();
      console.log(fmt.error(error.message));

      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        console.log(chalk.dim('\n  Check your API key configuration.'));
      }

      process.exit(1);
    }
  });

// ── 交互式确认 ──

async function _confirmCommit(message: string): Promise<boolean> {
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

        if (a === 'e') {
          console.log(chalk.dim('\nOpening your configured git editor...'));
          // TODO: 后续版本支持打开编辑器修改
          console.log(chalk.yellow('Editor mode coming in v0.2.0. Using AI message as-is.'));
          resolve(true);
          return;
        }

        // 默认（直接回车）→ 确认提交
        resolve(a !== 'n');
      },
    );
  });
}
