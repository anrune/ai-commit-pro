import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitReader } from '../core/git-reader.js';
import { LLMClient } from '../core/llm-client.js';
import { PromptEngine } from '../core/prompt-engine.js';
import { Formatter } from '../core/formatter.js';
import { loadConfig, checkApiKey } from '../config/loader.js';

const fmt = new Formatter();

export const changelogCommand = new Command('changelog')
  .alias('cl')
  .description('Generate CHANGELOG.md entry from commit history')
  .option('-f, --from <tag>', 'Starting tag or ref')
  .option('-t, --to <tag>', 'Ending tag or ref (default: HEAD)', 'HEAD')
  .option('-m, --model <model>', 'Override the LLM model')
  .option('-o, --output <file>', 'Write to file instead of stdout')
  .option('-a, --append', 'Append to existing CHANGELOG.md')
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

      // 确定起始点：优先用 --from，否则用最新 tag，都没有就用最近 50 条
      let from = options.from;
      if (!from) {
        const latestTag = await git.getLatestTag();
        from = latestTag || undefined;
      }

      // 读取 commit 历史
      spinner.start('Reading commit history...');
      let logResult = from
        ? await git.getCommitsBetween(from, options.to)
        : await git.getRecentCommits(50);

      // 如果 tag 之间没有新 commit（HEAD == tag），回退到最近 50 条
      let autoFallback = false;
      if (logResult.all.length === 0 && from) {
        logResult = await git.getRecentCommits(50);
        from = undefined;
        autoFallback = true;
      }

      const commits = logResult.all.map((c) => ({
        hash: c.hash,
        message: c.message,
        date: c.date,
        author: c.author_name || c.author_email,
      }));

      if (commits.length === 0) {
        spinner.fail('No commits found.');
        process.exit(1);
      }

      const tags = from ? [from, options.to] : undefined;
      spinner.succeed(
        `Found ${chalk.cyan(commits.length)} commits${from ? ` between ${chalk.yellow(from)} and ${chalk.yellow(options.to)}` : ''}`,
      );

      // 调用 LLM
      spinner.start('AI is categorizing commits...');
      spinner.color = 'yellow';

      const llm = new LLMClient({
        provider: config.provider || 'deepseek',
        apiKey: config.apiKey!,
        model: options.model || config.model,
        maxTokens: config.maxTokens,
      });

      const prompt = new PromptEngine(config.templatesDir);
      const { system, user } = await prompt.render('changelog', {
        diff: '', // changelog 用 commits 而非 diff
        branchName: await git.getCurrentBranch(),
        commits,
        tags,
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

      // 写入文件
      if (options.output) {
        const fs = await import('fs');
        const content = options.append
          ? response.text + '\n'
          : response.text;
        fs.writeFileSync(options.output, content, options.append ? { flag: 'a' } : undefined);
        console.log(chalk.green(`\nWritten to ${options.output}`));
      }
    } catch (error: any) {
      spinner.stop();
      console.log(fmt.error(error.message));
      process.exit(1);
    }
  });
