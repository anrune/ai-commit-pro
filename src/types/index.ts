// ── LLM Provider ──
export type Provider =
  | 'anthropic'
  | 'openai'
  | 'deepseek'        // 深度求索
  | 'qwen'            // 通义千问（阿里云 DashScope）
  | 'zhipu'           // 智谱 GLM
  | 'moonshot'        // Moonshot（月之暗面 Kimi）
  | 'siliconflow';    // 硅基流动（模型聚合平台）

// ── LLM 配置 ──
export interface LLMConfig {
  provider: Provider;
  apiKey: string;
  baseURL?: string;    // 自定义 API 地址（覆盖默认）
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// ── LLM 响应 ──
export interface LLMResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

// ── Prompt 上下文 ──
export interface PromptContext {
  diff: string;
  branchName?: string;
  targetBranch?: string;
  commits?: CommitInfo[];
  tags?: string[];
  repoInfo?: RepoInfo;
  extra?: Record<string, string>;
}

// ── Commit 信息 ──
export interface CommitInfo {
  hash: string;
  message: string;
  date: string;
  author: string;
}

// ── 仓库信息 ──
export interface RepoInfo {
  remote: string;
  branch: string;
}

// ── 用户配置 ──
export interface UserConfig {
  provider?: Provider;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  templatesDir?: string;
  lang?: 'en' | 'zh';
  maxTokens?: number;
}

// ── Changelog 条目 ──
export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'breaking' | 'perf' | 'refactor' | 'docs' | 'chore';
  message: string;
  hash: string;
}

// ── Release Notes ──
export interface ReleaseNotes {
  version: string;
  title: string;
  highlights: string[];
  changelog: ChangelogEntry[];
  breakingChanges: string[];
}
