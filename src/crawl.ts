import pLimit from 'p-limit'
import {
  normalizePageUrl,
  toLocalPath,
  detectBasePath,
  getDirectoryPath,
  addNumberedPrefix,
} from './url.js'
import { extractDocLinks } from './md.js'
import { saveFile } from './fs.js'
import { fetchWithFallback, closeBrowser, type CrawlOptions } from './adapters/index.js'
import { parseSitemap, findSitemapUrl, filterByBasePath } from './sitemap.js'
import { BlockedContentError } from './errors.js'

/**
 * Statistics for blocked pages
 */
interface BlockedPage {
  url: string
  reason: string
}

/**
 * Directory-based counter for numbered filenames
 */
class NumberedCounter {
  private counters = new Map<string, number>()

  /**
   * Get next number for a directory and increment counter
   */
  next(dir: string): number {
    const current = this.counters.get(dir) ?? 0
    const next = current + 1
    this.counters.set(dir, next)
    return next
  }
}

/**
 * Crawl a documentation site and save as markdown files
 */
export async function crawl(entry: string, options: CrawlOptions): Promise<void> {
  const entryUrl = normalizePageUrl(entry)
  const visited = new Set<string>()
  const failed: string[] = []
  const blocked: BlockedPage[] = []

  // Numbered filename counter (per-directory)
  const counter = options.numbered ? new NumberedCounter() : null

  // Concurrency limiter
  const limit = pLimit(options.concurrency || 3)

  console.log(`Starting crawl: ${entryUrl}`)
  if (options.useJina) {
    console.log('Using Jina Reader API (external)')
  } else {
    console.log('Using Playwright (local)')
  }

  try {
    // Sitemap mode
    if (options.useSitemap) {
      await crawlWithSitemap(entryUrl, options, limit, visited, failed, blocked, counter)
    } else {
      // Link crawl mode (default)
      await crawlWithLinks(entryUrl, options, limit, visited, failed, blocked, counter)
    }

    // Summary
    console.log('')
    console.log('='.repeat(50))
    console.log(`Done! Saved ${visited.size} pages to ${options.outDir}`)

    if (blocked.length > 0) {
      console.log(`Blocked: ${blocked.length} pages (bot protection detected)`)
      if (options.verbose) {
        blocked.forEach((b) => console.log(`  - ${b.url} (${b.reason})`))
      }
      console.log('Tip: Try --use-jina for sites with bot protection')
    }

    if (failed.length > 0) {
      console.log(`Failed: ${failed.length} pages`)
      if (options.verbose) {
        failed.forEach((url) => console.log(`  - ${url}`))
      }
    }
  } finally {
    // Clean up browser
    await closeBrowser()
  }
}

/**
 * Crawl using sitemap.xml
 */
async function crawlWithSitemap(
  entryUrl: URL,
  options: CrawlOptions,
  limit: ReturnType<typeof pLimit>,
  visited: Set<string>,
  failed: string[],
  blocked: BlockedPage[],
  counter: NumberedCounter | null
): Promise<void> {
  console.log('Using sitemap.xml for URL discovery')
  console.log('')

  // Find sitemap URL
  const sitemapUrl = await findSitemapUrl(entryUrl)
  if (!sitemapUrl) {
    throw new Error(`No sitemap found for ${entryUrl.origin}`)
  }
  console.log(`Found sitemap: ${sitemapUrl}`)

  // Parse sitemap
  let urls = await parseSitemap(sitemapUrl)
  console.log(`Sitemap contains ${urls.length} URLs`)

  // Filter by base path (e.g., /docs/)
  const basePath = detectBasePath(entryUrl)
  if (basePath) {
    urls = filterByBasePath(urls, basePath)
    console.log(`Filtered to ${urls.length} URLs matching ${basePath}`)
  }
  console.log('')

  // Crawl all URLs from sitemap
  const batches = chunkArray(urls, options.concurrency || 3)

  for (const batch of batches) {
    await Promise.all(
      batch.map((url) =>
        limit(async () => {
          const urlStr = url.toString()
          if (visited.has(urlStr)) return
          visited.add(urlStr)

          try {
            const result = await fetchWithFallback(url, options)
            let localPath = toLocalPath(url)

            // Add numbered prefix if enabled
            if (counter) {
              const dir = getDirectoryPath(localPath)
              const num = counter.next(dir)
              localPath = addNumberedPrefix(localPath, num)
            }

            const path = `${options.outDir}/${localPath}`
            await saveFile(path, result.content)
            console.log(`[${result.adapter}] Saved: ${path}`)
          } catch (error) {
            if (error instanceof BlockedContentError) {
              blocked.push({ url: urlStr, reason: error.reason })
              console.warn(`  [blocked] ${url.hostname} - ${error.reason}`)
            } else {
              const msg = error instanceof Error ? error.message : String(error)
              console.warn(`Failed: ${url} - ${msg}`)
              failed.push(urlStr)
            }
          }
        })
      )
    )
  }
}

/**
 * Crawl by following links (BFS)
 */
async function crawlWithLinks(
  entryUrl: URL,
  options: CrawlOptions,
  limit: ReturnType<typeof pLimit>,
  visited: Set<string>,
  failed: string[],
  blocked: BlockedPage[],
  counter: NumberedCounter | null
): Promise<void> {
  console.log('')

  // Fetch entry page
  const { content, adapter } = await fetchWithFallback(entryUrl, options)
  visited.add(entryUrl.toString())

  let entryLocalPath = toLocalPath(entryUrl)

  // Add numbered prefix if enabled
  if (counter) {
    const dir = getDirectoryPath(entryLocalPath)
    const num = counter.next(dir)
    entryLocalPath = addNumberedPrefix(entryLocalPath, num)
  }

  const localPath = `${options.outDir}/${entryLocalPath}`
  await saveFile(localPath, content)
  console.log(`[${adapter}] Saved: ${localPath}`)

  // Extract links
  const links = extractDocLinks(content, entryUrl)
  console.log(`Found ${links.length} links\n`)

  // BFS crawl with depth limit
  const maxDepth = options.depth ?? 1

  // Filter out already-visited URLs (e.g., entry page itself)
  const unvisitedLinks = links.filter((url) => !visited.has(url.toString()))

  const queue: Array<{ url: URL; depth: number }> =
    maxDepth > 0 ? unvisitedLinks.map((url) => ({ url, depth: 1 })) : []

  // Track URLs already in queue to prevent duplicates during parallel processing
  const queued = new Set<string>(unvisitedLinks.map((url) => url.toString()))

  while (queue.length > 0) {
    // Process in batches
    const batch = queue.splice(0, options.concurrency || 3)

    await Promise.all(
      batch.map((item) =>
        limit(async () => {
          const { url, depth } = item

          // Skip if already visited
          if (visited.has(url.toString())) {
            return
          }
          visited.add(url.toString())

          try {
            const result = await fetchWithFallback(url, options)
            let pagePath = toLocalPath(url)

            // Add numbered prefix if enabled
            if (counter) {
              const dir = getDirectoryPath(pagePath)
              const num = counter.next(dir)
              pagePath = addNumberedPrefix(pagePath, num)
            }

            const path = `${options.outDir}/${pagePath}`
            await saveFile(path, result.content)
            console.log(`[${result.adapter}] Saved: ${path}`)

            // Add new links if within depth limit
            if (depth < maxDepth) {
              const newLinks = extractDocLinks(result.content, url)
              for (const link of newLinks) {
                const linkStr = link.toString()
                // Check both visited and queued to prevent duplicates
                if (!visited.has(linkStr) && !queued.has(linkStr)) {
                  queue.push({ url: link, depth: depth + 1 })
                  queued.add(linkStr)
                }
              }
            }
          } catch (error) {
            if (error instanceof BlockedContentError) {
              blocked.push({ url: url.toString(), reason: error.reason })
              console.warn(`  [blocked] ${url.hostname} - ${error.reason}`)
            } else {
              const msg = error instanceof Error ? error.message : String(error)
              console.warn(`Failed: ${url} - ${msg}`)
              failed.push(url.toString())
            }
          }
        })
      )
    )
  }
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
