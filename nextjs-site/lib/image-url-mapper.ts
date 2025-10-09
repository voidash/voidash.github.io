import fs from 'fs'
import path from 'path'

type ImageCache = Record<string, string>

let imageCache: ImageCache | null = null

/**
 * Load image cache from disk (only once at runtime)
 * This runs at build time in Next.js
 */
function loadImageCache(): ImageCache {
  if (imageCache !== null) {
    return imageCache
  }

  try {
    const cachePath = path.join(process.cwd(), 'image-cache.json')

    if (!fs.existsSync(cachePath)) {
      console.warn('⚠️  image-cache.json not found. Run crawl-notion.js first.')
      imageCache = {}
      return imageCache as ImageCache
    }

    const cacheContent = fs.readFileSync(cachePath, 'utf-8')
    const parsedCache: ImageCache = JSON.parse(cacheContent)
    imageCache = parsedCache
    console.log(`✓ Loaded ${Object.keys(parsedCache).length} cached image mappings`)

    return parsedCache
  } catch (error) {
    console.error('Error loading image cache:', error)
    imageCache = {}
    return imageCache as ImageCache
  }
}

/**
 * Replace AWS Notion image URLs with local cached versions
 * This prevents images from expiring after AWS signature timeout
 *
 * @param url - Original Notion image URL (potentially from AWS S3)
 * @returns Local path if cached, original URL otherwise
 */
export function mapImageUrl(url: string): string {
  if (!url) return url

  const cache = loadImageCache()

  // Check if this exact URL is in cache
  if (cache[url]) {
    return cache[url]
  }

  // Try matching without query parameters (AWS signatures change)
  const urlWithoutQuery = url.split('?')[0]

  for (const [cachedUrl, localPath] of Object.entries(cache)) {
    const cachedUrlWithoutQuery = cachedUrl.split('?')[0]
    if (cachedUrlWithoutQuery === urlWithoutQuery) {
      return localPath
    }
  }

  // If not in cache, return original URL
  // This happens for external images or if cache is stale
  return url
}

/**
 * Replace all image URLs in a Notion block tree
 * Recursively processes blocks and their children
 */
export function replaceImageUrlsInBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks

  return blocks.map((block) => {
    // Handle image blocks
    if (block.type === 'image') {
      const imageData = block.image
      if (imageData?.file?.url) {
        const newUrl = mapImageUrl(imageData.file.url)
        return {
          ...block,
          image: {
            ...imageData,
            file: {
              ...imageData.file,
              url: newUrl
            }
          }
        }
      }

      if (imageData?.external?.url) {
        const newUrl = mapImageUrl(imageData.external.url)
        return {
          ...block,
          image: {
            ...imageData,
            external: {
              ...imageData.external,
              url: newUrl
            }
          }
        }
      }
    }

    // Recursively process children
    if (block.children && Array.isArray(block.children)) {
      return {
        ...block,
        children: replaceImageUrlsInBlocks(block.children)
      }
    }

    return block
  })
}
