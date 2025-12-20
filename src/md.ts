import { detectBasePath } from './url.js'

/**
 * Options for link extraction
 */
export interface ExtractLinksOptions {
  /** Base path to filter links (e.g., '/docs/') */
  basePath?: string

  /** Include external links (same origin only by default) */
  includeExternal?: boolean
}

/**
 * Extract documentation links from markdown/HTML content
 *
 * Supports:
 * - Markdown links: [text](url)
 * - HTML/JSX href: href="/docs/..." or href="https://..."
 */
export function extractDocLinks(
  content: string,
  base: URL,
  options: ExtractLinksOptions = {}
): URL[] {
  const links = new Set<string>()

  // Detect base path from URL if not provided
  const basePath = options.basePath || detectBasePath(base)

  // Markdown形式: [text](url)
  const mdRegex = /\[[^\]]+\]\(([^)]+)\)/g

  // HTML/JSX形式: href="/docs/..." または href="https://..."
  const hrefRegex = /href=["']([^"']+)["']/g

  const patterns = [mdRegex, hrefRegex]

  for (const regex of patterns) {
    for (const match of content.matchAll(regex)) {
      try {
        const raw = match[1].split('#')[0].trim()

        // Skip empty, mailto, javascript, and anchor-only links
        if (
          !raw ||
          raw.startsWith('mailto:') ||
          raw.startsWith('javascript:') ||
          raw.startsWith('#')
        ) {
          continue
        }

        // Skip markdown autolinks: <https://...> or URL-encoded versions (at start only)
        if (raw.startsWith('<') || raw.startsWith('%3C')) {
          continue
        }

        const url = new URL(raw, base)

        // Same origin check
        const isExternal = url.origin !== base.origin
        if (isExternal && !options.includeExternal) {
          continue
        }

        // Skip badge/image service domains (external links only)
        if (
          isExternal &&
          (url.hostname.includes('shields.io') ||
            url.hostname.includes('badge') ||
            url.hostname.includes('img.'))
        ) {
          continue
        }

        // Base path check (if specified)
        if (basePath && !url.pathname.startsWith(basePath)) {
          continue
        }

        // Skip files with extensions (images, PDFs, etc.)
        if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip|tar|gz)$/i)) {
          continue
        }

        // Remove hash and search params for consistency
        url.hash = ''
        url.search = ''
        links.add(url.toString())
      } catch {
        // Invalid URL, skip
      }
    }
  }

  return [...links].map((u) => new URL(u))
}
