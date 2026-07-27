import { cosmiconfig } from 'cosmiconfig';
import type { UserConfig, Provider } from '../types/index.js';

// ── 各 Provider 对应的 API Key 环境变量名 ──
const PROVIDER_KEY_ENV: Record<Provider, string> = {
  deepseek: 'DEEPSEEK_API_KEY',
  qwen: 'DASHSCOPE_API_KEY',
  zhipu: 'ZHIPU_API_KEY',
  moonshot: 'MOONSHOT_API_KEY',
  siliconflow: 'SILICONFLOW_API_KEY',
};

// ── 有效 Provider 列表 ──
const VALID_PROVIDERS: Provider[] = [
  'deepseek', 'qwen', 'zhipu', 'moonshot', 'siliconflow',
];

/**
 * 配置加载器。
 *
 * 优先级（由高到低）：
 *   1. 命令行参数
 *   2. 环境变量（AI_COMMIT_* / Provider 专属 KEY / 通用 KEY）
 *   3. 配置文件
 *   4. 默认值
 */
export async function loadConfig(): Promise<UserConfig> {
  const explorer = cosmiconfig('ai-commit');
  const result = await explorer.search().catch(() => null);
  const fileConfig: UserConfig = result?.config || {};

  // 推断 provider
  const provider = resolveProvider(fileConfig);

  // 推断 apiKey
  const apiKey = resolveApiKey(provider, fileConfig);

  return {
    provider,
    apiKey,
    baseURL: fileConfig.baseURL,
    model: process.env.AI_COMMIT_MODEL || fileConfig.model,
    templatesDir: process.env.AI_COMMIT_TEMPLATES_DIR || fileConfig.templatesDir,
    lang: (process.env.AI_COMMIT_LANG as 'en' | 'zh') || fileConfig.lang || 'en',
    maxTokens: fileConfig.maxTokens || 4096,
  };
}

/**
 * 确定使用的 Provider。
 */
function resolveProvider(fileConfig: UserConfig): Provider {
  // 1. 环境变量显式指定
  if (process.env.AI_COMMIT_PROVIDER) {
    const p = process.env.AI_COMMIT_PROVIDER as Provider;
    if (VALID_PROVIDERS.includes(p)) return p;
  }

  // 2. 配置文件指定
  if (fileConfig.provider && VALID_PROVIDERS.includes(fileConfig.provider)) {
    return fileConfig.provider;
  }

  // 3. 根据哪个 API Key 已配置来自动判断
  for (const provider of VALID_PROVIDERS) {
    if (process.env[PROVIDER_KEY_ENV[provider]]) return provider;
  }

  // 4. 兜底
  return 'deepseek';
}

/**
 * 确定 API Key。
 */
function resolveApiKey(provider: Provider, fileConfig: UserConfig): string | undefined {
  // 1. 当前 provider 的专属环境变量
  const key = process.env[PROVIDER_KEY_ENV[provider]];
  if (key) return key;

  // 2. 配置文件
  if (fileConfig.apiKey) return fileConfig.apiKey;

  return undefined;
}

/**
 * 检查 API Key 是否已配置，返回友好提示。
 */
export function checkApiKey(config: UserConfig): { ok: true } | { ok: false; message: string } {
  if (config.apiKey) return { ok: true };

  const provider = config.provider || 'deepseek';
  const envVar = PROVIDER_KEY_ENV[provider];

  const providerNames: Record<Provider, string> = {
    deepseek: 'DeepSeek（深度求索）',
    qwen: 'Qwen / 通义千问（阿里云 DashScope）',
    zhipu: 'GLM（智谱）',
    moonshot: 'Kimi（月之暗面）',
    siliconflow: 'SiliconFlow（硅基流动）',
  };

  const registerUrls: Record<Provider, string> = {
    deepseek: 'https://platform.deepseek.com/',
    qwen: 'https://dashscope.console.aliyun.com/',
    zhipu: 'https://open.bigmodel.cn/',
    moonshot: 'https://platform.moonshot.cn/',
    siliconflow: 'https://cloud.siliconflow.cn/',
  };

  return {
    ok: false,
    message: [
      `No API key found for provider "${provider}" (${providerNames[provider] || provider}).`,
      '',
      'Set it via one of:',
      `  1. Environment variable: export ${envVar}=<your-key>`,
      '  2. Config file: create .ai-commit.yml with `apiKey` field',
      '  3. Or use any other provider key (auto-detected)',
      '',
      `Get a key at: ${registerUrls[provider]}`,
    ].join('\n'),
  };
}
