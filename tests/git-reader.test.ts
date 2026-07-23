import { describe, it, expect } from 'vitest';
import { GitReader } from '../src/core/git-reader.js';

describe('GitReader', () => {
  const git = new GitReader();

  it('should detect this is a git repository', async () => {
    const isRepo = await git.isRepo();
    expect(isRepo).toBe(true);
  });

  it('should get current branch name', async () => {
    const branch = await git.getCurrentBranch();
    expect(branch).toBeTruthy();
    expect(typeof branch).toBe('string');
  });

  it('should get staged diff (likely empty in CI)', async () => {
    const diff = await git.getStagedDiff();
    expect(typeof diff).toBe('string');
  });

  it('should get repo info', async () => {
    const info = await git.getRepoInfo();
    expect(info).toHaveProperty('branch');
    expect(info).toHaveProperty('remote');
  });
});
