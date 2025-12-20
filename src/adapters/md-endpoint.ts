import type { SiteAdapter } from './types.js'
import { defaults } from '../config/defaults.js'

/**
 * Fetch markdown from .md endpoint
 */
async function fetchMdEndpoint(url: URL): Promise<string> {
  // Construct .md URL
  const mdUrl = new URL(url.toString())
  if (!mdUrl.pathname.endsWith('.md')) {
    mdUrl.pathname = mdUrl.pathname.replace(/\/$/, '') + '.md'
  }

  const res = await fetch(mdUrl.toString(), {
    headers: {
      'User-Agent': defaults.userAgent,
      Accept: 'text/markdown,text/plain,*/*',
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${mdUrl}`)
  }

  // Validate Content-Type header
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    throw new Error('Received JSON instead of Markdown')
  }
  if (contentType.includes('text/html') && !contentType.includes('text/markdown')) {
    throw new Error('Received HTML instead of Markdown (Content-Type)')
  }

  const text = await res.text()
  const trimmed = text.trim()
  const trimmedLower = trimmed.toLowerCase()

  // Validate response is not HTML
  if (
    trimmedLower.startsWith('<!doctype') ||
    trimmedLower.startsWith('<html') ||
    trimmedLower.startsWith('<head') ||
    trimmedLower.startsWith('<body')
  ) {
    throw new Error('Received HTML instead of Markdown')
  }

  // Validate response is not JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    throw new Error('Received JSON instead of Markdown')
  }

  // Check for empty or too short content
  if (trimmed.length < 10) {
    throw new Error('Response too short to be valid Markdown')
  }

  return text
}

/**
 * Known domains that support .md endpoint (Stainless-powered docs)
 */
export const MD_ENDPOINT_DOMAINS = [
  'docs.anthropic.com',
  'docs.claude.com',
  'code.claude.com',
  'developers.openai.com',
]

/**
 * Check if a domain supports .md endpoint
 */
export function supportsMdEndpoint(hostname: string): boolean {
  return MD_ENDPOINT_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  )
}

/**
 * MD Endpoint Adapter
 * For sites that support fetching .md directly (Stainless-powered docs)
 */
export const mdEndpointAdapter: SiteAdapter = {
  name: 'md-endpoint',

  match: (url: URL): boolean => {
    return supportsMdEndpoint(url.hostname)
  },

  fetchMarkdown: fetchMdEndpoint,
}
