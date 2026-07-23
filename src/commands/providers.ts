import { Command } from 'commander';
import { listProviders } from '../core/llm-client.js';

export const providersCommand = new Command('providers')
  .alias('ls')
  .description('List all supported LLM providers and their default models')
  .action(() => {
    const providers = listProviders();

    console.log('');
    console.log('  Supported LLM Providers:');
    console.log('  ─────────────────────────');

    for (const p of providers) {
      const flag = p.id === 'deepseek' ? ' ⭐ 推荐' : '';
      console.log(`  ${p.name}`);
      console.log(`    ID: ${p.id}${flag}`);
      console.log(`    Default model: ${p.model}`);
      console.log(`    API: ${p.baseURL}`);
      console.log('');
    }

    console.log('  Set API key via environment variable:');
    console.log('    deepseek   → DEEPSEEK_API_KEY');
    console.log('    qwen       → DASHSCOPE_API_KEY');
    console.log('    zhipu      → ZHIPU_API_KEY');
    console.log('    moonshot   → MOONSHOT_API_KEY');
    console.log('    siliconflow→ SILICONFLOW_API_KEY');
    console.log('    anthropic  → ANTHROPIC_API_KEY');
    console.log('    openai     → OPENAI_API_KEY');
    console.log('');
  });
