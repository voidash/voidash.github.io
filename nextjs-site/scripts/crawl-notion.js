/**
 * Notion Page Crawler with Image Caching
 * Runs at build time to discover all Notion pages and download images locally
 *
 * Usage: node scripts/crawl-notion.js
 * Output: JSON file with all discovered page IDs and cached images
 */

const { Client } = require('@notionhq/client')
const fs = require('fs')
const path = require('path')
const https = require('https')
const crypto = require('crypto')

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const TIMELINE_DB_ID = process.env.TIMELINE_DB_ID || '70bfec27eb6a4e11882b95e32bfdcdca'
const BOOKMARKS_DB_ID = process.env.BOOKMARKS_DB_ID || '6fab1aca487d4d8c875e6625c5d01a0a'
const BOOKS_DB_ID = process.env.BOOKS_DB_ID || 'ce0fa1f0d55b4d1f9e993ca6520455b4'

const discoveredPages = new Set()
const imageCache = {}

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5').update(url).digest('hex')
    const ext = url.split('?')[0].split('.').pop() || 'jpg'
    const filename = `${hash}.${ext}`
    const dir = path.join(process.cwd(), 'public', 'notion-images')
    const filepath = path.join(dir, filename)

    if (fs.existsSync(filepath)) {
      imageCache[url] = `/notion-images/${filename}`
      resolve(`/notion-images/${filename}`)
      return
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        imageCache[url] = `/notion-images/${filename}`
        console.log(`    ↳ Downloaded image: ${filename}`)
        resolve(`/notion-images/${filename}`)
      })
    }).on('error', (err) => {
      fs.unlink(filepath, () => {})
      reject(err)
    })
  })
}

async function processBlockImages(blocks) {
  for (const block of blocks) {
    if (block.type === 'image') {
      const imageUrl = block.image?.file?.url || block.image?.external?.url
      if (imageUrl && imageUrl.includes('secure.notion-static.com')) {
        try {
          await downloadImage(imageUrl)
        } catch (err) {
          console.error(`    ✗ Failed to download image: ${imageUrl}`, err.message)
        }
      }
    }
  }
}

async function crawlNotionPage(pageId) {
  if (discoveredPages.has(pageId)) {
    console.log(`  ↳ Already crawled: ${pageId}`)
    return []
  }

  discoveredPages.add(pageId)
  console.log(`Crawling page: ${pageId}`)

  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    })

    await processBlockImages(response.results)

    const childPageIds = []
    for (const block of response.results) {
      if (block.type === 'child_page') {
        console.log(`  ↳ Found child page: ${block.id}`)
        childPageIds.push(block.id)
        const nestedPages = await crawlNotionPage(block.id)
        childPageIds.push(...nestedPages)
      }
    }

    return childPageIds
  } catch (error) {
    console.error(`Error crawling page ${pageId}:`, error.message)
    return []
  }
}

async function getPagesFromDatabase(databaseId) {
  console.log(`\nFetching pages from database: ${databaseId}`)

  try {
    const response = await notion.databases.query({
      database_id: databaseId.replace(/-/g, ''),
      page_size: 100,
    })

    const pageIds = []
    for (const page of response.results) {
      const properties = page.properties
      const isPage = properties.isPage?.checkbox || false

      if (isPage) {
        const title = properties.Title?.title?.[0]?.plain_text || properties.Name?.title?.[0]?.plain_text || 'Untitled'
        console.log(`  ✓ Found page: ${title} (${page.id})`)
        pageIds.push(page.id)
        const nestedPages = await crawlNotionPage(page.id)
        pageIds.push(...nestedPages)
      }
    }

    return pageIds
  } catch (error) {
    console.error(`Error fetching database ${databaseId}:`, error.message)
    return []
  }
}

async function getBooksChildPages(pageId) {
  console.log(`\nFetching books from page: ${pageId}`)

  try {
    const response = await notion.blocks.children.list({
      block_id: pageId.replace(/-/g, ''),
      page_size: 100,
    })

    const bookPageIds = []
    for (const block of response.results) {
      if (block.type === 'child_page') {
        const title = block.child_page?.title || 'Untitled'
        console.log(`  ✓ Found book: ${title} (${block.id})`)
        bookPageIds.push(block.id)
        const nestedPages = await crawlNotionPage(block.id)
        bookPageIds.push(...nestedPages)
      }
    }

    return bookPageIds
  } catch (error) {
    console.error(`Error fetching books page ${pageId}:`, error.message)
    return []
  }
}

async function crawlAllNotionPages() {
  console.log('='.repeat(60))
  console.log('Starting Notion page crawler...')
  console.log('='.repeat(60))

  const allPageIds = []
  const timelinePages = await getPagesFromDatabase(TIMELINE_DB_ID)
  allPageIds.push(...timelinePages)
  const bookmarkPages = await getPagesFromDatabase(BOOKMARKS_DB_ID)
  allPageIds.push(...bookmarkPages)
  const bookPages = await getBooksChildPages(BOOKS_DB_ID)
  allPageIds.push(...bookPages)

  const uniquePageIds = [...new Set(allPageIds)]

  console.log('\n' + '='.repeat(60))
  console.log(`✓ Crawl complete! Found ${uniquePageIds.length} unique pages`)
  console.log(`✓ Downloaded ${Object.keys(imageCache).length} images`)
  console.log('='.repeat(60))

  const outputPath = path.join(__dirname, '..', 'notion-pages.json')
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ pages: uniquePageIds, timestamp: new Date().toISOString() }, null, 2)
  )
  console.log(`\n✓ Saved to: ${outputPath}`)

  const imageCachePath = path.join(__dirname, '..', 'image-cache.json')
  fs.writeFileSync(imageCachePath, JSON.stringify(imageCache, null, 2))
  console.log('✓ Image cache saved to:', imageCachePath)

  return uniquePageIds
}

if (require.main === module) {
  crawlAllNotionPages()
    .then(() => {
      console.log('\n✓ Crawler finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n✗ Crawler failed:', error)
      process.exit(1)
    })
}

module.exports = { crawlAllNotionPages }
