import chalk from 'chalk';
import type { CommitInfo } from '../types/index.js';

/**
 * 终端输出格式化工具。
 */
export class Formatter {
  /** 打印分隔线 */
  divider(char = '─', length = 60): string {
    return chalk.dim(char.repeat(length));
  }

  /** 格式化 commit message 展示 */
  formatCommitMessage(message: string): string {
    const lines = message.trim().split('\n');
    const subject = lines[0];
    const body = lines.slice(1).join('\n');

    let output = '';
    output += chalk.bold.green(subject) + '\n';
    if (body.trim()) {
      output += chalk.dim(body);
    }
    return output;
  }

  /** 格式化 token 用量 */
  formatUsage(inputTokens: number, outputTokens: number, cost: number): string {
    return chalk.dim(
      `Tokens: ${inputTokens} in + ${outputTokens} out  |  Cost: $${cost.toFixed(4)}`,
    );
  }

  /** 格式化 commit 列表（用于 changelog） */
  formatCommitList(commits: CommitInfo[]): string {
    return commits
      .map(c => `  ${chalk.yellow(c.hash.slice(0, 7))}  ${c.message.split('\n')[0]}`)
      .join('\n');
  }

  /** 错误消息 */
  error(message: string): string {
    return chalk.red(`❌ ${message}`);
  }

  /** 成功消息 */
  success(message: string): string {
    return chalk.green(`✅ ${message}`);
  }

  /** 提示消息 */
  info(message: string): string {
    return chalk.blue(`ℹ  ${message}`);
  }

  /** 警告消息 */
  warn(message: string): string {
    return chalk.yellow(`⚠️  ${message}`);
  }
}
