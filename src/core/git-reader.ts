import simpleGit, { type SimpleGit, type LogResult } from 'simple-git';
import type { RepoInfo } from '../types/index.js';

/**
 * 封装所有 Git 操作，提供类型安全的 API。
 */
export class GitReader {
  private git: SimpleGit;

  constructor(cwd?: string) {
    this.git = simpleGit(cwd || process.cwd());
  }

  /** 检查是否在有效的 git 仓库中 */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  /** 暂存所有变更（同 git add -A） */
  async stageAll(): Promise<void> {
    await this.git.add(['-A']);
  }

  /** 获取暂存区 diff */
  async getStagedDiff(): Promise<string> {
    return this.git.diff(['--cached']);
  }

  /** 获取暂存区变更的文件列表 */
  async getStagedFiles(): Promise<string[]> {
    const result = await this.git.diff(['--cached', '--name-only']);
    return result.split('\n').filter(Boolean);
  }

  /** 获取工作区 diff（未暂存） */
  async getUnstagedDiff(): Promise<string> {
    return this.git.diff();
  }

  /** 获取暂存 + 未暂存的全部 diff */
  async getAllDiff(): Promise<string> {
    return this.git.diff(['HEAD']);
  }

  /** 获取当前分支相对目标分支的 diff */
  async getBranchDiff(targetBranch: string = 'main'): Promise<string> {
    // 依次尝试本地、remote、常见别名（master）
    const candidates = [
      targetBranch,
      `origin/${targetBranch}`,
      // 如果 main 找不到，尝试 master（旧 repo 默认分支名）
      ...(targetBranch === 'main' ? ['master', 'origin/master'] : []),
    ];

    for (const ref of candidates) {
      try {
        const result = await this.git.diff([`${ref}...HEAD`]);
        return result;
      } catch {
        continue;
      }
    }

    // 全都没匹配到，回退到 targetBranch 让它报原始错误
    return this.git.diff([`${targetBranch}...HEAD`]);
  }

  /** 获取两个引用之间的文件变更列表 */
  async getChangedFiles(from: string, to: string = 'HEAD'): Promise<string[]> {
    const result = await this.git.diff(['--name-only', from, to]);
    return result.split('\n').filter(Boolean);
  }

  /** 获取两个 tag/ref 之间的 commits */
  async getCommitsBetween(from: string, to: string): Promise<LogResult> {
    return this.git.log({ from, to });
  }

  /** 获取最近 N 条 commit */
  async getRecentCommits(count: number = 20): Promise<LogResult> {
    return this.git.log({ maxCount: count });
  }

  /** 获取当前分支名 */
  async getCurrentBranch(): Promise<string> {
    const result = await this.git.branch();
    return result.current;
  }

  /** 获取仓库信息 */
  async getRepoInfo(): Promise<RepoInfo> {
    const [remoteUrl, branch] = await Promise.all([
      this.git.remote(['get-url', 'origin']).catch(() => ''),
      this.getCurrentBranch(),
    ]);
    // 清理 remote URL，移除 .git 后缀
    const remote = remoteUrl?.trim().replace(/\.git$/, '') || '';
    return { remote, branch };
  }

  /** 执行 git commit */
  async commit(message: string, files?: string[]): Promise<void> {
    if (files && files.length > 0) {
      await this.git.commit(message, files);
    } else {
      await this.git.commit(message);
    }
  }

  /** 获取所有 tags */
  async getTags(): Promise<string[]> {
    const result = await this.git.tags();
    return result.all;
  }

  /** 获取最近的 tag */
  async getLatestTag(): Promise<string | null> {
    try {
      const result = await this.git.raw(['describe', '--tags', '--abbrev=0']);
      return result.trim() || null;
    } catch {
      return null;
    }
  }
}
