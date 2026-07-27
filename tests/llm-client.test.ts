import { describe, it, expect } from 'vitest';
import { LLMClient } from '../src/core/llm-client.js';

describe('LLMClient', () => {
  it('should create instance with minimal config', () => {
    const client = new LLMClient({
      provider: 'deepseek',
      apiKey: 'test-key',
    });
    expect(client).toBeDefined();
  });

  it('should throw on API call with invalid key', async () => {
    const client = new LLMClient({
      provider: 'deepseek',
      apiKey: 'invalid-key',
    });

    // 使用空 diff 会触发 API 调用，但由于 key 无效应该报错
    await expect(
      client.chat('You are a helpful assistant.', 'Hello'),
    ).rejects.toThrow();
  });
});
