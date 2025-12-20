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

  const text = await res.text()

  // Validate response is markdown, not HTML
  const trimmed = text.trim().toLowerCase()
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    throw new Error('Received HTML instead of Markdown')
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
