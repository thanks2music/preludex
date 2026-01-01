# preludex

[![npm version](https://img.shields.io/npm/v/preludex.svg)](https://www.npmjs.com/package/preludex)

A CLI tool for downloading documentation sites as clean Markdown files. Perfect for offline reading, LLM/AI knowledge bases, and local search.

## Features

- **Framework Auto-Detection** - Automatically detects and optimizes for popular documentation frameworks
- **Clean Markdown Output** - Converts HTML to well-formatted Markdown with proper heading structure
- **Link Crawling** - Follows internal links with configurable depth control
- **Sitemap Support** - Bulk download using sitemap.xml
- **Multiple Adapters** - Playwright (default), MD Endpoint, Jina Reader API, and direct MDX fetching
- **Parallel Processing** - Configurable concurrency for faster downloads
- **Numbered Output** - Optional sequential prefixes for ordered file naming (e.g., `01-intro.md`, `02-setup.md`)

## Supported Frameworks

preludex automatically detects and applies optimized settings for:

| Framework | Examples |
|-----------|----------|
| **Docusaurus** | React Native, Jest, Babel |
| **VitePress** | Hono, Vue.js, Vite |
| **MkDocs** | Material for MkDocs |
| **Starlight** | Astro, Cloudflare Docs |
| **Sphinx** | Python, pip, Read the Docs |
| **GitBook** | Various hosted docs |

## Installation

```bash
# npm
npm install -g preludex

# Or run directly with npx/bunx
npx preludex <url>
bunx preludex <url>
```

**Note:** Playwright requires browser binaries. Install them with:

```bash
npx playwright install chromium
# or
bunx playwright install chromium
```

## Usage

### Basic Usage

```bash
# Download a documentation page and its linked pages
preludex https://hono.dev/docs --out docs/hono

# Crawl deeper (follow links up to 3 levels)
preludex https://example.com/docs --depth 3 --out docs/example
```

### Using Sitemap

```bash
# Download all pages listed in sitemap.xml
preludex https://example.com/docs --use-sitemap --out docs/example
```

### Using MD Endpoint

```bash
# Automatically uses MD endpoint for supported sites (Stainless-powered docs)
preludex https://docs.anthropic.com/en/docs --out docs/anthropic

# Force MD endpoint for other compatible sites
preludex https://example.com/docs --use-md-endpoint --out docs/example
```

### Numbered Output

```bash
# Add sequential prefixes to filenames (useful for ordered documentation)
preludex https://example.com/docs --numbered --out docs/example

# Output: 01-getting-started.md, 02-installation.md, 03-configuration.md, ...
```

### Using Jina Reader API

```bash
# Use Jina Reader API (requires JINA_API_KEY environment variable for higher limits)
preludex https://example.com/docs --use-jina --out docs/example
```

## Options

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--out` | `-o` | `docs` | Output directory |
| `--depth` | `-d` | `1` | Maximum crawl depth (0 = entry page only) |
| `--concurrency` | `-c` | `3` | Number of parallel requests |
| `--use-sitemap` | | `false` | Use sitemap.xml for URL discovery |
| `--use-jina` | | `false` | Use Jina Reader API instead of Playwright |
| `--use-md-endpoint` | | `false` | Fetch .md files directly (auto-enabled for supported sites) |
| `--numbered` | | `false` | Add numbered prefixes to filenames (e.g., `01-index.md`) |
| `--verbose` | | `false` | Show detailed output |
| `--help` | `-h` | | Show help |
| `--version` | `-v` | | Show version |

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

## How It Works

1. **Fetch** - Downloads the page using Playwright (headless browser) or Jina Reader API
2. **Detect** - Identifies the documentation framework and applies optimized selectors
3. **Extract** - Removes navigation, sidebars, and other non-content elements
4. **Convert** - Transforms HTML to clean Markdown using Turndown
5. **Crawl** - Extracts internal links and queues them for processing (BFS)
6. **Save** - Writes Markdown files preserving the URL structure

## Use Cases

- **Offline Documentation** - Read docs without internet access
- **LLM Knowledge Base** - Feed documentation to AI assistants (Claude, GPT, etc.)
- **Local Search** - Use ripgrep, grep, or IDE search across all docs
- **Obsidian/Notion Import** - Build personal knowledge bases
- **Archive** - Preserve documentation for reference

## Adapters

preludex uses different adapters based on the target site:

| Adapter | Use Case | Method |
|---------|----------|--------|
| **MD Endpoint** | Stainless-powered docs | Direct .md file fetch |
| **Playwright** | Most sites (default) | Headless browser rendering |
| **MDX** | Claude Docs, Vercel, Next.js | Direct .md/.mdx file fetch |
| **Jina** | Fallback / API-based | Jina Reader API |

The adapter is automatically selected based on the target site:

- **MD Endpoint** is auto-enabled for: `docs.anthropic.com`, `docs.claude.com`, `code.claude.com`, `developers.openai.com`
- Use `--use-md-endpoint` to force this adapter for other Stainless-powered documentation sites
- Use `--use-jina` to use the Jina Reader API

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JINA_API_KEY` | Optional. Jina Reader API key for higher rate limits |

## Requirements

- Node.js >= 18.0.0 or Bun >= 1.0.0
- Playwright Chromium (auto-installed on first run)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

- Repository: https://github.com/thanks2music/preludex
- Issues: https://github.com/thanks2music/preludex/issues

## Development

### Setup

```bash
# Install dependencies
bun install

# Build
bun run build

# Run in development mode
bun src/cli.ts <url> [options]
```

### Release Workflow

This project uses GitHub Actions with [npm Trusted Publisher](https://docs.npmjs.com/generating-provenance-statements) (OIDC) for automated releases.

```bash
# 1. Commit your changes on a feature branch
git add .
git commit -m "your commit message"

# 2. Push to remote and create a PR
git push origin <branch-name>
gh pr create --title "your PR title"

# 3. After PR is merged, update local main
git checkout main
git pull origin main

# 4. Bump version + create tag + push
npm version patch  # or minor/major
git push origin main --tags
```

GitHub Actions will automatically:
- Build the project
- Publish to npm
- Create a GitHub Release with auto-generated release notes
