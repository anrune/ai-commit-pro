import { describe, it, expect } from 'vitest';
import { PromptEngine } from '../src/core/prompt-engine.js';

describe('PromptEngine', () => {
  const engine = new PromptEngine();

  it('should render commit template with context', async () => {
    const { system, user } = await engine.render('commit', {
      diff: 'test diff content',
      branchName: 'test-branch',
    });

    expect(system).toBeTruthy();
    expect(user).toBeTruthy();
    expect(user).toContain('test diff content');
    expect(user).toContain('test-branch');
  });

  it('should throw for non-existent template', async () => {
    await expect(
      engine.render('nonexistent', { diff: '' }),
    ).rejects.toThrow('Template "nonexistent" not found');
  });
});
