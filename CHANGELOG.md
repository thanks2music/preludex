# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.5] - 2026-01-31

### Added

- GitHub repository markdown download support
  - Direct markdown file access via GitHub API
  - GitHub Trees API for efficient file listing (supports up to 100,000 files)
  - Support for slash-containing branch names (e.g., `feature/foo`)
  - Automatic default branch detection
  - Progress tracking with ETA calculation
  - Rate limit monitoring and automatic waiting
- Error handling improvements
  - Automatic retry with exponential backoff
  - GitHub API rate limit monitoring and auto-wait
  - Detailed error classification (permanent/temporary/rate-limit)
  - Configurable log levels (debug/info/warn/error)
- Optimization features
  - GitHub API response caching (1-hour TTL)
  - Duplicate file detection
  - File size limits (10MB default) for memory protection
- Resume functionality infrastructure (Node.js compatible)

### Changed

- Updated adapter priority: GitHub adapter now has highest priority for GitHub URLs
- Improved relative link handling for .md endpoints
- Enhanced path traversal protection

### Tested

Verified with repositories:
- [fastify/fastify](https://github.com/fastify/fastify) - 51 files
- [denoland/deno](https://github.com/denoland/deno) - 97 files
- [vercel/next.js](https://github.com/vercel/next.js) - 1,074 files

## [0.3.4] - 2026-01-29

### Fixed

- Resolved relative links from .md endpoint content
- Improved link extraction for MDX adapter

## [0.3.3] - Earlier

### Added

- MD endpoint adapter with auto-detection for Claude/OpenAI Codex docs
- Numbered filename prefix option (`--numbered`)

### Changed

- Improved framework detection reliability
- Enhanced error messages for blocked content

## [0.3.0] - Earlier

### Added

- Playwright adapter as default
- MDX adapter for direct markdown file access
- Jina Reader API adapter (opt-in with `--use-jina`)
- Framework auto-detection (Docusaurus, VitePress, MkDocs, Sphinx, Starlight, GitBook)
- Sitemap support for bulk downloads
- Configurable crawl depth
- Parallel processing with configurable concurrency

### Changed

- Switched from Cheerio to Playwright for better JavaScript rendering support

## [0.2.0] - Earlier

### Added

- Initial release with basic crawling functionality
- Turndown for HTML to Markdown conversion
- BFS link crawling

## [0.1.0] - Initial Release

### Added

- Basic CLI tool for downloading documentation as Markdown
- Simple HTML to Markdown conversion

---

[0.3.5]: https://github.com/thanks2music/preludex/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/thanks2music/preludex/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/thanks2music/preludex/compare/v0.3.0...v0.3.3
[0.3.0]: https://github.com/thanks2music/preludex/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/thanks2music/preludex/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/thanks2music/preludex/releases/tag/v0.1.0
