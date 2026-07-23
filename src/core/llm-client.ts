import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Provider, LLMConfig, LLMResponse } from '../types/index.js';

// ── 各 Provider 默认配置 ──
interface ProviderDefaults {
  baseURL: string;
  model: string;
  pricing: { input: number; output: number }; // $/1M tokens
}

const PROVIDER_DEFAULTS: Record<Provider, ProviderDefaults> = {
  // ── 国外 ──
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-6',
    pricing: { input: 3, output: 15 },
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    pricing: { input: 2.5, output: 10 },
  },

  // ── 国内（均兼容 OpenAI API 格式） ──
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    pricing: { input: 0.14, output: 0.28 }, // 极低价格
  },
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    pricing: { input: 0.55, output: 2.2 },
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    pricing: { input: 0.29, output: 0.29 }, // GLM-4-Flash 免费但有频率限制
  },
  moonshot: {
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    pricing: { input: 1.67, output: 5.0 },
  },
  siliconflow: {
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen3-235B-A22B',
    pricing: { input: 0.29, output: 0.82 }, // 硅基流动上 Qwen3 的价格
  },
};

const COST_FREE = 0; // 标记免费模型

/**
 * 统一的 LLM 调用客户端。
 * 国外 Provider (Anthropic) 用原生 SDK，其余用 OpenAI 兼容 API。
 */
export class LLMClient {
  private config: Required<Omit<LLMConfig, 'baseURL'>> & { baseURL: string };

  constructor(config: LLMConfig) {
    const defaults = PROVIDER_DEFAULTS[config.provider];

    this.config = {
      provider: config.provider,
      apiKey: config.apiKey,
      baseURL: config.baseURL || defaults.baseURL,
      model: config.model || defaults.model,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.3,
    };
  }

  /** 发送聊天请求 */
  async chat(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    // Anthropic 使用原生 SDK
    if (this.config.provider === 'anthropic') {
      return this._callAnthropic(systemPrompt, userMessage);
    }

    // 其余所有 Provider 走 OpenAI 兼容 API
    return this._callOpenAICompatible(systemPrompt, userMessage);
  }

  // ── Anthropic 原生 SDK ──

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

  // ── OpenAI 兼容 API（所有国内模型 + OpenAI） ──

  private async _callOpenAICompatible(
    systemPrompt: string,
    userMessage: string,
  ): Promise<LLMResponse> {
    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });

    const response = await client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
      text: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens,
        outputTokens,
        cost: this._calcCost(inputTokens, outputTokens),
      },
    };
  }

  // ── 成本计算 ──

  private _calcCost(inputTokens: number, outputTokens: number): number {
    const pricing = PROVIDER_DEFAULTS[this.config.provider].pricing;
    return (
      (inputTokens / 1_000_000) * pricing.input +
      (outputTokens / 1_000_000) * pricing.output
    );
  }
}

/**
 * 获取 Provider 的默认配置信息（用于展示给用户）。
 */
export function getProviderInfo(provider: Provider): ProviderDefaults {
  return PROVIDER_DEFAULTS[provider];
}

/**
 * 列出所有可用的 Provider。
 */
export function listProviders(): Array<{ id: Provider; name: string; model: string; baseURL: string }> {
  return [
    { id: 'deepseek', name: 'DeepSeek（深度求索）', model: PROVIDER_DEFAULTS.deepseek.model, baseURL: PROVIDER_DEFAULTS.deepseek.baseURL },
    { id: 'qwen', name: 'Qwen（通义千问）', model: PROVIDER_DEFAULTS.qwen.model, baseURL: PROVIDER_DEFAULTS.qwen.baseURL },
    { id: 'zhipu', name: 'GLM（智谱）', model: PROVIDER_DEFAULTS.zhipu.model, baseURL: PROVIDER_DEFAULTS.zhipu.baseURL },
    { id: 'moonshot', name: 'Kimi（月之暗面）', model: PROVIDER_DEFAULTS.moonshot.model, baseURL: PROVIDER_DEFAULTS.moonshot.baseURL },
    { id: 'siliconflow', name: 'SiliconFlow（硅基流动）', model: PROVIDER_DEFAULTS.siliconflow.model, baseURL: PROVIDER_DEFAULTS.siliconflow.baseURL },
    { id: 'anthropic', name: 'Anthropic Claude', model: PROVIDER_DEFAULTS.anthropic.model, baseURL: PROVIDER_DEFAULTS.anthropic.baseURL },
    { id: 'openai', name: 'OpenAI GPT', model: PROVIDER_DEFAULTS.openai.model, baseURL: PROVIDER_DEFAULTS.openai.baseURL },
  ];
}
