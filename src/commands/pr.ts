import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitReader } from '../core/git-reader.js';
import { LLMClient } from '../core/llm-client.js';
import { PromptEngine } from '../core/prompt-engine.js';
import { Formatter } from '../core/formatter.js';
import { loadConfig, checkApiKey } from '../config/loader.js';

const fmt = new Formatter();

export const prCommand = new Command('pr')
  .alias('p')
  .description('Generate a PR title and description from branch diff')
  .option('-t, --target <branch>', 'Target branch', 'main')
  .option('-m, --model <model>', 'Override the LLM model')
  .option('-d, --dry-run', 'Show without creating PR')
  .action(async (options) => {
    const spinner = ora();

    try {
      const git = new GitReader();

      if (!(await git.isRepo())) {
        console.log(fmt.error('Not a git repository.'));
        process.exit(1);
      }

      const config = await loadConfig();
      const keyCheck = checkApiKey(config);
      if (!keyCheck.ok) {
        console.log(fmt.error(keyCheck.message));
        process.exit(1);
      }

      // 读取分支 diff
      spinner.start(`Computing diff ${options.target}...HEAD...`);
      const diff = await git.getBranchDiff(options.target);

      if (!diff.trim()) {
        spinner.fail(`No differences found between ${options.target} and current branch.`);
        console.log(chalk.dim('\n  Have you made any commits on this branch?'));
        process.exit(1);
      }

      const [branchName, repoInfo] = await Promise.all([
        git.getCurrentBranch(),
        git.getRepoInfo(),
      ]);
      spinner.succeed(
        `Branch ${chalk.cyan(branchName)} has changes vs ${chalk.cyan(options.target)}`,
      );

      // 调用 LLM
      spinner.start('AI is generating PR description...');
      spinner.color = 'yellow';

      const llm = new LLMClient({
        provider: config.provider || 'deepseek',
        apiKey: config.apiKey!,
        model: options.model || config.model,
        maxTokens: config.maxTokens,
      });

      const prompt = new PromptEngine(config.templatesDir);
      const { system, user } = await prompt.render('pr', {
        diff,
        branchName,
        targetBranch: options.target,
        repoInfo,
      });

      const startTime = Date.now();
      const response = await llm.chat(system, user);
      const elapsed = Date.now() - startTime;
      spinner.succeed(`Generated in ${(elapsed / 1000).toFixed(1)}s`);

      // 解析标题和正文
      const text = response.text.trim();
      let title = '';
      let body = text;

      const titleMatch = text.match(/^TITLE:\s*(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
        body = text.replace(/^TITLE:\s*.+$/m, '').trim();
      }

      // 展示结果
      console.log('');
      console.log(fmt.divider());
      if (title) {
        console.log(chalk.bold.green(title));
        console.log('');
      }
      console.log(body ? chalk.white(body) : chalk.green(text));
      console.log(fmt.divider());
      console.log(fmt.formatUsage(response.usage.inputTokens, response.usage.outputTokens, response.usage.cost));

      console.log('');
      if (options.dryRun) {
        console.log(chalk.dim('(Dry run — PR was not created)'));
      } else {
        console.log(chalk.dim('Tip: Copy the title and body above to create your PR.'));
        console.log(chalk.dim(`     Or use: gh pr create --title "${title}" --body "..."`));
      }
    } catch (error: any) {
      spinner.stop();
      console.log(fmt.error(error.message));
      process.exit(1);
    }
  });
