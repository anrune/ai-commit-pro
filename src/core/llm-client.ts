import OpenAI from 'openai';
import type { Provider, LLMConfig, LLMResponse } from '../types/index.js';

// ── 各 Provider 默认配置 ──
interface ProviderDefaults {
  baseURL: string;
  model: string;
  pricing: { input: number; output: number }; // $/1M tokens
}

const PROVIDER_DEFAULTS: Record<Provider, ProviderDefaults> = {
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-flash',
    pricing: { input: 0.14, output: 0.28 },
  },
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    pricing: { input: 0.11, output: 0.28 },
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    pricing: { input: 0, output: 0 },
  },
  moonshot: {
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'kimi-k2.5',
    pricing: { input: 0.20, output: 2.0 },
  },
  siliconflow: {
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen3-235B-A22B',
    pricing: { input: 0.29, output: 0.82 },
  },
};

/**
 * 统一的 LLM 调用客户端。
 * 所有 Provider 均走 OpenAI 兼容 API，仅 baseURL 和 apiKey 不同。
 */
export class LLMClient {
  private config: Required<Omit<LLMConfig, 'baseURL'>> & { baseURL: string };

  constructor(config: LLMConfig) {
    const defaults = PROVIDER_DEFAULTS[config.provider];
    if (!defaults) {
      throw new Error(
        `Unknown provider "${config.provider}". Supported: ${Object.keys(PROVIDER_DEFAULTS).join(', ')}`,
      );
    }

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
 * 列出所有可用的 Provider。
 */
export function listProviders(): Array<{ id: Provider; name: string; model: string; baseURL: string }> {
  return [
    { id: 'deepseek', name: 'DeepSeek（深度求索）⭐', model: PROVIDER_DEFAULTS.deepseek.model, baseURL: PROVIDER_DEFAULTS.deepseek.baseURL },
    { id: 'qwen', name: 'Qwen（通义千问）', model: PROVIDER_DEFAULTS.qwen.model, baseURL: PROVIDER_DEFAULTS.qwen.baseURL },
    { id: 'zhipu', name: 'GLM（智谱）', model: PROVIDER_DEFAULTS.zhipu.model, baseURL: PROVIDER_DEFAULTS.zhipu.baseURL },
    { id: 'moonshot', name: 'Kimi（月之暗面）', model: PROVIDER_DEFAULTS.moonshot.model, baseURL: PROVIDER_DEFAULTS.moonshot.baseURL },
    { id: 'siliconflow', name: 'SiliconFlow（硅基流动）', model: PROVIDER_DEFAULTS.siliconflow.model, baseURL: PROVIDER_DEFAULTS.siliconflow.baseURL },
  ];
}
