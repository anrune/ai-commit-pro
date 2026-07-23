import Handlebars from 'handlebars';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PromptContext } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 注册 Handlebars 自定义 helper
Handlebars.registerHelper('eq', function (a: unknown, b: unknown) {
  return a === b;
});

/**
 * 模板引擎 —— 加载、编译、渲染 prompt 模板。
 *
 * 模板查找优先级：
 *   1. 用户项目目录 .ai-commit/templates/<name>.hbs
 *   2. 内置模板 src/templates/<name>.hbs
 *
 * 模板文件格式：
 *   用 `---USER---` 分隔 system prompt 和 user prompt。
 */
export class PromptEngine {
  private templatesDir: string;
  private cache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || join(__dirname, '..', 'templates');
  }

  /**
   * 渲染模板，返回分离的 system + user prompt。
   */
  async render(
    templateName: string,
    context: PromptContext,
  ): Promise<{ system: string; user: string }> {
    const template = await this._loadTemplate(templateName);
    const raw = template(context);

    // ---USER--- 作为 system / user 分隔符
    const idx = raw.indexOf('---USER---');
    if (idx === -1) {
      // 没有分隔符，整体作为 user prompt
      return { system: '', user: raw.trim() };
    }

    return {
      system: raw.slice(0, idx).trim(),
      user: raw.slice(idx + '---USER---'.length).trim(),
    };
  }

  // ── 私有方法 ──

  private async _loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    if (this.cache.has(name)) return this.cache.get(name)!;

    // 1. 用户自定义模板优先
    const userPath = join(process.cwd(), '.ai-commit', 'templates', `${name}.hbs`);
    // 2. 内置模板
    const builtinPath = join(this.templatesDir, `${name}.hbs`);

    const path = existsSync(userPath) ? userPath : builtinPath;

    if (!existsSync(path)) {
      throw new Error(
        `Template "${name}" not found.\n` +
          `  Looked in:\n` +
          `    ${userPath}\n` +
          `    ${builtinPath}\n\n` +
          `  Create a custom template at .ai-commit/templates/${name}.hbs`,
      );
    }

    const content = readFileSync(path, 'utf-8');
    const compiled = Handlebars.compile(content);
    this.cache.set(name, compiled);
    return compiled;
  }
}
