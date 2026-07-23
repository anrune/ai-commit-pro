import { cosmiconfig } from 'cosmiconfig';
import type { UserConfig, Provider } from '../types/index.js';

/**
 * 配置加载器。
 *
 * 优先级（由高到低）：
 *   1. 命令行参数
 *   2. 环境变量（AI_COMMIT_* / ANTHROPIC_API_KEY / OPENAI_API_KEY）
 *   3. 配置文件（.ai-commitrc / .ai-commit.yml / ai-commit.config.js 等）
 *   4. 默认值
 */
export async function loadConfig(): Promise<UserConfig> {
  const explorer = cosmiconfig('ai-commit');
  const result = await explorer.search().catch(() => null);

  const fileConfig: UserConfig = result?.config || {};

  return {
    provider:
      (process.env.AI_COMMIT_PROVIDER as Provider) ||
      fileConfig.provider ||
      'anthropic',

    apiKey:
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      fileConfig.apiKey,

    model:
      process.env.AI_COMMIT_MODEL ||
      fileConfig.model,

    templatesDir:
      process.env.AI_COMMIT_TEMPLATES_DIR ||
      fileConfig.templatesDir,

    lang:
      (process.env.AI_COMMIT_LANG as 'en' | 'zh') ||
      fileConfig.lang ||
      'en',

    maxTokens:
      fileConfig.maxTokens || 4096,
  };
}

/**
 * 检查 API Key 是否已配置，返回友好提示。
 */
export function checkApiKey(config: UserConfig): { ok: true } | { ok: false; message: string } {
  if (config.apiKey) return { ok: true };

  const provider = config.provider || 'anthropic';
  const envVar = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';

  return {
    ok: false,
    message: [
      `No API key found for provider "${provider}".`,
      '',
      'Set it via one of:',
      `  1. Environment variable: export ${envVar}=<your-key>`,
      '  2. Config file: create .ai-commit.yml with `apiKey` field',
      '',
      `Get a key at: ${provider === 'anthropic' ? 'https://console.anthropic.com/' : 'https://platform.openai.com/'}`,
    ].join('\n'),
  };
}
