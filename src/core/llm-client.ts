import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Provider, LLMConfig, LLMResponse } from '../types/index.js';

// ── 各模型价格（$/1M tokens，2026 年 7 月） ──
const PRICES: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4-8': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 0.8, output: 4 },
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  // 默认兜底
  default: { input: 3, output: 15 },
};

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
};

/**
 * 统一的 LLM 调用客户端。
 * 屏蔽不同 Provider 的 SDK 差异，提供一致接口。
 */
export class LLMClient {
  private config: Required<LLMConfig>;

  constructor(config: LLMConfig) {
    this.config = {
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model || DEFAULT_MODELS[config.provider],
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.3,
    };
  }

  /** 发送聊天请求 */
  async chat(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    if (this.config.provider === 'anthropic') {
      return this._callAnthropic(systemPrompt, userMessage);
    }
    return this._callOpenAI(systemPrompt, userMessage);
  }

  // ── Anthropic ──

  private async _callAnthropic(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const client = new Anthropic({ apiKey: this.config.apiKey });
    const response = await client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cost: this._calcCost(response.usage.input_tokens, response.usage.output_tokens),
      },
    };
  }

  // ── OpenAI ──

  private async _callOpenAI(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const client = new OpenAI({ apiKey: this.config.apiKey });
    const response = await client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    return {
      text: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        cost: this._calcCost(
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0,
        ),
      },
    };
  }

  // ── 成本计算 ──

  private _calcCost(inputTokens: number, outputTokens: number): number {
    const price = PRICES[this.config.model] || PRICES.default;
    return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
  }
}
