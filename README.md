# preludex

> Download documentation sites as clean Markdown files

[![npm version](https://badge.fury.io/js/preludex.svg)](https://www.npmjs.com/package/preludex)
[![npm downloads](https://img.shields.io/npm/dm/preludex.svg)](https://www.npmjs.com/package/preludex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI tool for downloading documentation sites as Markdown files. Perfect for offline reading, LLM/AI knowledge bases, and local search.

## Features

- **Auto-detection** - Automatically detects and optimizes for major documentation frameworks
- **GitHub Support** - Download Markdown files directly from GitHub repositories
- **Clean Output** - Converts HTML to well-formatted Markdown
- **Link Crawling** - Follows internal links with configurable depth control
- **Sitemap Support** - Bulk download using sitemap.xml
- **Multiple Adapters** - GitHub, Playwright (default), Jina Reader API, MDX direct fetch
- **Parallel Processing** - Configurable concurrency for fast downloads
- **Progress Tracking** - Real-time progress with ETA calculation
- **Rate Limiting** - Automatic GitHub API rate limit monitoring and handling

## Installation

```bash
# Install globally
npm install -g preludex

# Or use directly with npx
npx preludex <url>
```

**Note:** Playwright requires browser binaries:

```bash
npx playwright install chromium
```

## Quick Start

```bash
# Download documentation with linked pages
preludex https://hono.dev/docs --out docs/hono

# Download from GitHub repository
preludex https://github.com/fastify/fastify --out docs/fastify

# Crawl deeper (3 levels)
preludex https://example.com/docs --depth 3 --out docs/example

# Use sitemap for bulk download
preludex https://example.com/docs --use-sitemap --out docs/example
```

## Supported Frameworks

preludex automatically detects and applies optimal settings for:

| Framework | Examples |
|-----------|----------|
| **GitHub Repositories** | Next.js, Fastify, Deno (README + docs/) |
| **Docusaurus** | React Native, Jest, Babel |
| **VitePress** | Hono, Vue.js, Vite |
| **MkDocs** | Material for MkDocs |
| **Starlight** | Astro, Cloudflare Docs |
| **Sphinx** | Python, pip, Read the Docs |
| **GitBook** | Various hosted documentation |

## GitHub Repository Downloads

Download Markdown files directly from GitHub repositories:

```bash
# Download all Markdown files from a repository
preludex https://github.com/fastify/fastify --out docs/fastify

# Specify a branch
preludex https://github.com/facebook/react/tree/main --out docs/react

# Download from a specific directory
preludex https://github.com/denoland/deno/tree/main/docs --out docs/deno

# With authentication (recommended to avoid rate limits)
GITHUB_TOKEN=ghp_xxx preludex https://github.com/vercel/next.js --out docs/nextjs
```

**GitHub Features:**
- Automatically detects README.md and all Markdown files in docs/ directory
- Fast file listing via GitHub Trees API (handles up to 100,000 files)
- Auto-detects default branch
- Supports branch names with slashes (e.g., `feature/new-feature`)
- Progress tracking and rate limit monitoring
- Rate limits: 60 requests/hour (unauthenticated), 5,000 requests/hour (authenticated)

## CLI Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--out` | `-o` | `docs` | Output directory |
| `--depth` | `-d` | `1` | Maximum crawl depth (0 = entry page only) |
| `--concurrency` | `-c` | `3` | Number of parallel requests |
| `--use-sitemap` | | `false` | Use sitemap.xml for URL discovery |
| `--use-jina` | | `false` | Use Jina Reader API instead of Playwright |
| `--verbose` | | `false` | Show detailed output |
| `--help` | `-h` | | Show help |
| `--version` | `-v` | | Show version |

## How It Works

1. **Fetch** - Retrieves pages using Playwright (headless browser) or Jina Reader API
2. **Detect** - Identifies documentation framework and applies optimal selectors
3. **Extract** - Removes non-content elements (navigation, sidebars, etc.)
4. **Convert** - Converts HTML to clean Markdown using Turndown
5. **Crawl** - Extracts internal links and adds to processing queue (BFS)
6. **Save** - Saves Markdown files preserving URL structure

## Output Structure

preludex preserves the documentation structure in the output directory:

```
Input URL: https://example.com/docs/guide/getting-started

Output:
docs/
├── getting-started.md
├── api/
│   ├── overview.md
│   └── reference.md
└── guide/
    └── advanced.md
```

## Use Cases

- **Offline Documentation** - Read docs without internet connection
- **LLM Knowledge Base** - Feed documentation to AI assistants (Claude, GPT, etc.)
- **Local Search** - Search entire documentation with ripgrep, grep, or IDE search
- **Obsidian/Notion** - Build personal knowledge bases
- **Archival** - Preserve documentation for reference

## Adapters

preludex uses different adapters based on the target site:

| Adapter | Use Case | Method | Priority |
|---------|----------|--------|----------|
| **GitHub** | GitHub repositories | GitHub API + Raw URL | 1 |
| **MDX** | Claude Docs, Vercel, Next.js | Direct .md/.mdx file fetch | 2 |
| **Jina** | API-based (with `--use-jina` flag) | Jina Reader API | 3 |
| **Playwright** | Most sites (default) | Headless browser rendering | 4 |

Adapters are automatically selected based on URL patterns. When a GitHub repository URL is detected, the GitHub adapter is used with highest priority.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub API token (increases rate limit from 60/hour to 5,000/hour) | none |
| `JINA_API_KEY` | Jina Reader API key for higher rate limits | none |
| `PRELUDEX_LOG_LEVEL` | Log level (`debug`, `info`, `warn`, `error`) | `info` |

**Getting a GitHub Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Select "Generate new token (classic)"
3. Select `public_repo` scope (for public repositories only)
4. Generate and copy the token
5. Set environment variable: `export GITHUB_TOKEN=ghp_your_token_here`

## Requirements

- Node.js >= 18.0.0 or Bun >= 1.0.0
- Playwright Chromium (auto-installed on first run)

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev <url>

# Build
bun run build
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and detailed changes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Links

- [npm Package](https://www.npmjs.com/package/preludex)
- [GitHub Repository](https://github.com/thanks2music/preludex)
- [Issue Tracker](https://github.com/thanks2music/preludex/issues)
