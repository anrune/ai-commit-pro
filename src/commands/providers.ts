import { Command } from 'commander';
import { listProviders } from '../core/llm-client.js';
import { loadConfig } from '../config/loader.js';
import type { Provider } from '../types/index.js';

const KEY_ENV_MAP: Record<Provider, string> = {
  deepseek: 'DEEPSEEK_API_KEY',
  qwen: 'DASHSCOPE_API_KEY',
  zhipu: 'ZHIPU_API_KEY',
  moonshot: 'MOONSHOT_API_KEY',
  siliconflow: 'SILICONFLOW_API_KEY',
};

export const providersCommand = new Command('providers')
  .alias('ls')
  .description('List all supported LLM providers and show current active one')
  .action(async () => {
    const config = await loadConfig();
    const providers = listProviders();

    console.log('');
    console.log('  💡 当前使用：' + config.provider + (config.model ? ' / ' + config.model : ''));
    console.log('  配置状态：' + (config.apiKey ? '✅ API Key 已配置' : '❌ 未配置 API Key'));
    console.log('');
    console.log('  Supported LLM Providers:');
    console.log('  ─────────────────────────');

    for (const p of providers) {
      const isActive = p.id === config.provider;
      const marker = isActive ? ' ★ 当前' : '';
      const hasKey = !!process.env[KEY_ENV_MAP[p.id]];
      const status = hasKey ? '✅' : '⚪';

      console.log(`  ${status} ${p.name}${marker}`);
      console.log(`    ID: ${p.id}`);
      console.log(`    Default model: ${p.model}`);
      console.log(`    API: ${p.baseURL}`);
      console.log('');
    }

    console.log('  Set API key via environment variable:');
    for (const [id, env] of Object.entries(KEY_ENV_MAP)) {
      const hasKey = !!process.env[env];
      console.log(`    ${hasKey ? '✅' : '⚪'} ${id.padEnd(12)} → ${env}`);
    }
    console.log('');
  });
