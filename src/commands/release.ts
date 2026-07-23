import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitReader } from '../core/git-reader.js';
import { LLMClient } from '../core/llm-client.js';
import { PromptEngine } from '../core/prompt-engine.js';
import { Formatter } from '../core/formatter.js';
import { loadConfig, checkApiKey } from '../config/loader.js';

const fmt = new Formatter();

export const releaseCommand = new Command('release')
  .alias('r')
  .description('Generate GitHub Release Notes')
  .option('-f, --from <tag>', 'Starting tag (required)')
  .option('-t, --to <tag>', 'Ending tag (default: HEAD)', 'HEAD')
  .option('-v, --version <version>', 'Release version string')
  .option('-m, --model <model>', 'Override the LLM model')
  .option('--publish', 'Create release via GitHub API (requires gh CLI)')
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

      // 确定起始 tag
      const from = options.from || (await git.getLatestTag());
      if (!from) {
        console.log(fmt.error('No starting tag found. Specify --from <tag> or create a tag first.'));
        process.exit(1);
      }

      const version = options.version || options.to;

      // 读取 commit 历史
      spinner.start(`Reading commits from ${from} to ${options.to}...`);
      const logResult = await git.getCommitsBetween(from, options.to);

      const commits = logResult.all.map((c) => ({
        hash: c.hash,
        message: c.message,
        date: c.date,
        author: c.author_name || c.author_email,
      }));

      if (commits.length === 0) {
        spinner.fail(`No commits found between ${from} and ${options.to}.`);
        process.exit(1);
      }

      spinner.succeed(`Found ${chalk.cyan(commits.length)} commits`);

      // 调用 LLM
      spinner.start('AI is writing release notes...');
      spinner.color = 'yellow';

      const llm = new LLMClient({
        provider: config.provider || 'anthropic',
        apiKey: config.apiKey!,
        model: options.model || config.model,
        maxTokens: config.maxTokens,
      });

      const prompt = new PromptEngine(config.templatesDir);
      const [repoInfo, branchName] = await Promise.all([
        git.getRepoInfo(),
        git.getCurrentBranch(),
      ]);

      const { system, user } = await prompt.render('release', {
        diff: '',
        branchName,
        commits,
        repoInfo,
        tags: [from, options.to],
        extra: { version },
      });

      const startTime = Date.now();
      const response = await llm.chat(system, user);
      const elapsed = Date.now() - startTime;
      spinner.succeed(`Generated in ${(elapsed / 1000).toFixed(1)}s`);

      // 输出
      console.log('');
      console.log(fmt.divider());
      console.log(response.text);
      console.log(fmt.divider());
      console.log(fmt.formatUsage(response.usage.inputTokens, response.usage.outputTokens, response.usage.cost));

      // GitHub 发布
      if (options.publish) {
        console.log(chalk.dim('\nTip: Use the following to create a GitHub release:'));
        console.log(chalk.dim(`  gh release create ${version} --title "${version}" --notes-file -`));
      }
    } catch (error: any) {
      spinner.stop();
      console.log(fmt.error(error.message));
      process.exit(1);
    }
  });
