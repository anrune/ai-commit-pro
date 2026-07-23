# Contributing to AI Commit Pro

Thanks for your interest in contributing! 🎉

## Getting Started

```bash
git clone https://github.com/anrune/ai-commit-pro.git
cd ai-commit-pro
pnpm install
pnpm build
```

## Development

```bash
# Watch mode — rebuild on file change
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Link locally to test in another project
npm link
cd ~/another-project
ai-commit --help
```

## Project Structure

```
src/
├── index.ts            # CLI entry point
├── commands/           # CLI subcommands
│   ├── commit.ts       # ai-commit command
│   ├── pr.ts           # ai-commit pr
│   ├── changelog.ts    # ai-commit changelog
│   └── release.ts      # ai-commit release
├── core/               # Core engine
│   ├── git-reader.ts   # Git operations wrapper
│   ├── llm-client.ts   # Unified LLM API client
│   ├── prompt-engine.ts # Template-based prompt engine
│   └── formatter.ts    # Terminal output formatting
├── config/             # Configuration
│   └── loader.ts       # Config file & env loading
├── templates/          # Built-in prompt templates
│   ├── commit.hbs
│   ├── pr.hbs
│   ├── changelog.hbs
│   └── release.hbs
└── types/              # TypeScript type definitions
    └── index.ts
```

## Adding a New Command

1. Create a new file in `src/commands/`
2. Export a `Command` instance
3. Register it in `src/index.ts`

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
And yes, we use AI Commit Pro to generate our own commit messages 🤖

## Questions?

Open an issue: https://github.com/anrune/ai-commit-pro/issues
