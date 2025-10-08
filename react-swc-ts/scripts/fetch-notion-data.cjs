const { Client } = require('@notionhq/client')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const crypto = require('crypto')

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.VITE_NOTION_TOKEN
const TIMELINE_DB_ID = '70bfec27eb6a4e11882b95e32bfdcdca'
const BOOKMARKS_DB_ID = '6fab1aca487d4d8c875e6625c5d01a0a'

// Notion page IDs to cache (from listOfSpotLightElements.tsx)
const NOTION_PAGES = [
  { id: '171c12466a36808fbbb4cdbfcbbe8366', name: 'blueprint-2025' },
  { id: 'f114f9d0040842adb8649125f13407dc', name: 'music' },
  { id: '171c12466a36802a9ebdf6ec516f7f3f', name: 'setup' },
  { id: '171c12466a3680869dd4dd1007de7b10', name: 'books' },
]

if (!NOTION_TOKEN) {
  console.error('Error: NOTION_TOKEN not found in environment')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_TOKEN })

async function fetchDatabase(databaseId) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    })

    const results = response.results.map((page) => {
      const properties = page.properties
      const transformed = { id: page.id }

      Object.keys(properties).forEach((key) => {
        const prop = properties[key]

        switch (prop.type) {
          case 'title':
            transformed[key] = prop.title?.[0]?.plain_text || ''
            break
          case 'rich_text':
            transformed[key] = prop.rich_text?.[0]?.plain_text || ''
            break
          case 'date':
            if (prop.date) {
              transformed.StartDate = prop.date.start
              transformed.EndDate = prop.date.end
            }
            break
          case 'checkbox':
            transformed[key] = prop.checkbox
            break
          case 'url':
            transformed[key] = prop.url || ''
            break
          case 'multi_select':
            transformed[key] = prop.multi_select.map((item) => item.name)
            break
          default:
            break
        }
      })

      return transformed
    })

    return results
  } catch (error) {
    console.error(`Error fetching database ${databaseId}:`, error.message)
    throw error
  }
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(filepath)

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}) // Delete incomplete file
      reject(err)
    })
  })
}

// Extract image URLs from Notion block map recursively
function extractImageUrls(blockMap, imageUrls = new Set()) {
  if (!blockMap || typeof blockMap !== 'object') return imageUrls

  Object.keys(blockMap).forEach((key) => {
    const block = blockMap[key]?.value

    if (!block) return

    // Check for image blocks
    if (block.type === 'image') {
      const imageUrl = block.properties?.source?.[0]?.[0]
      if (imageUrl && imageUrl.startsWith('http')) {
        imageUrls.add(imageUrl)
      }
    }

    // Check for file blocks
    if (block.type === 'file') {
      const fileUrl = block.properties?.source?.[0]?.[0]
      if (fileUrl && fileUrl.startsWith('http') && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl)) {
        imageUrls.add(fileUrl)
      }
    }

    // Recursively check nested content
    if (block.content) {
      block.content.forEach(childId => {
        extractImageUrls({ [childId]: blockMap[childId] }, imageUrls)
      })
    }
  })

  return imageUrls
}

// Replace image URLs in block map with local paths
function replaceImageUrls(blockMap, urlMap) {
  if (!blockMap || typeof blockMap !== 'object') return blockMap

  const newBlockMap = JSON.parse(JSON.stringify(blockMap)) // Deep clone

  Object.keys(newBlockMap).forEach((key) => {
    const block = newBlockMap[key]?.value

    if (!block) return

    // Replace image URLs
    if (block.type === 'image' && block.properties?.source?.[0]?.[0]) {
      const originalUrl = block.properties.source[0][0]
      if (urlMap[originalUrl]) {
        block.properties.source[0][0] = urlMap[originalUrl]
      }
    }

    // Replace file URLs
    if (block.type === 'file' && block.properties?.source?.[0]?.[0]) {
      const originalUrl = block.properties.source[0][0]
      if (urlMap[originalUrl]) {
        block.properties.source[0][0] = urlMap[originalUrl]
      }
    }
  })

  return newBlockMap
}

// Fetch signed URLs for images using Notion API
async function getSignedImageUrl(blockId) {
  try {
    const block = await notion.blocks.retrieve({ block_id: blockId })
    if (block.type === 'image') {
      return block.image?.file?.url || block.image?.external?.url
    }
    return null
  } catch (error) {
    console.error(`Error fetching block ${blockId}:`, error.message)
    return null
  }
}

// Fetch Notion page blocks using notion-api-worker format
async function fetchNotionPage(pageId) {
  try {
    const response = await fetch(`https://cloudfare-notion-worker.ashish-thapa477.workers.dev/v1/page/${pageId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch page ${pageId}: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching page ${pageId}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('Fetching Notion data...')

  // Create public directories
  const publicDir = path.join(__dirname, '..', 'public', 'data')
  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'notion')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  // Fetch timeline
  console.log('Fetching timeline...')
  const timeline = await fetchDatabase(TIMELINE_DB_ID)
  fs.writeFileSync(
    path.join(publicDir, 'timeline.json'),
    JSON.stringify(timeline, null, 2)
  )
  console.log(`✓ Timeline: ${timeline.length} items`)

  // Fetch bookmarks
  console.log('Fetching bookmarks...')
  const bookmarks = await fetchDatabase(BOOKMARKS_DB_ID)
  fs.writeFileSync(
    path.join(publicDir, 'bookmarks.json'),
    JSON.stringify(bookmarks, null, 2)
  )
  console.log(`✓ Bookmarks: ${bookmarks.length} items`)

  // Fetch and cache Notion pages with images
  console.log('\nFetching Notion pages...')
  const urlMap = {} // Map original URLs to local paths

  for (const page of NOTION_PAGES) {
    console.log(`Fetching page: ${page.name}...`)
    const blockMap = await fetchNotionPage(page.id)

    // Extract image block IDs and URLs from blockMap
    const imageBlocks = []
    Object.keys(blockMap).forEach((key) => {
      const block = blockMap[key]?.value
      if (block && block.type === 'image') {
        const imageUrl = block.properties?.source?.[0]?.[0]
        if (imageUrl && imageUrl.startsWith('http')) {
          imageBlocks.push({
            blockId: key,
            oldUrl: imageUrl
          })
        }
      }
    })

    console.log(`  Found ${imageBlocks.length} images`)

    // Download images using fresh signed URLs from Notion API
    for (const imageBlock of imageBlocks) {
      // Get fresh signed URL from Notion API
      const signedUrl = await getSignedImageUrl(imageBlock.blockId)

      if (!signedUrl) {
        console.error(`  ✗ Failed to get signed URL for block ${imageBlock.blockId}`)
        continue
      }

      const hash = crypto.createHash('md5').update(imageBlock.blockId).digest('hex')
      const ext = path.extname(new URL(signedUrl).pathname).split('?')[0] || '.jpg'
      const filename = `${hash}${ext}`
      const filepath = path.join(imagesDir, filename)
      const localPath = `/spa/images/notion/${filename}`

      if (!fs.existsSync(filepath)) {
        try {
          await downloadImage(signedUrl, filepath)
          console.log(`  ✓ Downloaded: ${filename}`)
        } catch (error) {
          console.error(`  ✗ Failed to download from ${signedUrl}:`, error.message)
          continue
        }
      } else {
        console.log(`  → Cached: ${filename}`)
      }

      urlMap[imageBlock.oldUrl] = localPath
    }

    // Replace URLs in block map
    const processedBlockMap = replaceImageUrls(blockMap, urlMap)

    // Save processed page
    fs.writeFileSync(
      path.join(publicDir, `${page.name}.json`),
      JSON.stringify(processedBlockMap, null, 2)
    )
    console.log(`✓ Saved ${page.name}.json`)
  }

  console.log('\nData fetched successfully!')
}

main().catch((error) => {
  console.error('Failed to fetch Notion data:', error)
  process.exit(1)
})
