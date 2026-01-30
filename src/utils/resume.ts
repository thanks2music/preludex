/**
 * Resume functionality for interrupted downloads
 */

import { join } from 'path'
import { readFile, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'

export interface DownloadState {
  url: string
  totalFiles: number
  downloadedFiles: string[]
  timestamp: number
}

/**
 * Manages download state for resume functionality
 */
export class ResumeManager {
  private stateFile: string

  constructor(outDir: string) {
    this.stateFile = join(outDir, '.preludex-state.json')
  }

  /**
   * Load saved download state
   */
  async loadState(): Promise<DownloadState | null> {
    try {
      if (!existsSync(this.stateFile)) return null

      const content = await readFile(this.stateFile, 'utf-8')
      return JSON.parse(content) as DownloadState
    } catch (error) {
      return null
    }
  }

  /**
   * Save current download state
   */
  async saveState(state: DownloadState): Promise<void> {
    try {
      await writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf-8')
    } catch (error) {
      // Silently fail - resume is optional
    }
  }

  /**
   * Clear saved state (called on successful completion)
   */
  async clearState(): Promise<void> {
    try {
      if (existsSync(this.stateFile)) {
        await unlink(this.stateFile)
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Filter out already-downloaded files
   */
  filterPendingFiles<T extends { path: string }>(
    allFiles: T[],
    downloaded: string[]
  ): T[] {
    const downloadedSet = new Set(downloaded)
    return allFiles.filter((file) => !downloadedSet.has(file.path))
  }

  /**
   * Create download state object
   */
  createState(url: string, totalFiles: number, downloadedFiles: string[]): DownloadState {
    return {
      url,
      totalFiles,
      downloadedFiles,
      timestamp: Date.now(),
    }
  }
}
