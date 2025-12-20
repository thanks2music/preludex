/**
 * Error types for preludex
 */

/**
 * Reason for content being blocked
 */
export type BlockedReason = 'cloudflare' | 'bot-detection' | 'empty' | 'access-denied' | 'unknown'

/**
 * Error thrown when content is blocked by bot protection
 */
export class BlockedContentError extends Error {
  constructor(
    public readonly url: URL,
    public readonly reason: BlockedReason,
    message?: string
  ) {
    super(message || `Content blocked: ${url.hostname} (${reason})`)
    this.name = 'BlockedContentError'
  }

  /**
   * Get a user-friendly suggestion for resolving the error
   */
  getSuggestion(): string {
    switch (this.reason) {
      case 'cloudflare':
        return 'Try using --use-jina flag for sites with Cloudflare protection.'
      case 'bot-detection':
        return 'Try using --use-jina flag for sites with bot protection.'
      case 'empty':
        return 'The page may require JavaScript or have no content.'
      case 'access-denied':
        return 'The site may require authentication or block automated access.'
      default:
        return 'Try using --use-jina flag or check if the site is accessible.'
    }
  }
}
