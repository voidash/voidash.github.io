/**
 * Notion Page Crawler
 * Runs at build time to discover all Notion pages that need to be statically generated
 *
 * Usage: node scripts/crawl-notion.js
 * Output: JSON file with all discovered page IDs
 */

const { Client } = require('@notionhq/client')
const fs = require('fs')
const path = require('path')

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const TIMELINE_DB_ID = process.env.TIMELINE_DB_ID || '70bfec27eb6a4e11882b95e32bfdcdca'
const BOOKMARKS_DB_ID = process.env.BOOKMARKS_DB_ID || '6fab1aca487d4d8c875e6625c5d01a0a'

// Store discovered pages to avoid infinite loops
const discoveredPages = new Set()

/**
 * Fetch blocks from a Notion page and look for child pages
 */
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

    const childPageIds = []

    // Look for child_page blocks
    for (const block of response.results) {
      if (block.type === 'child_page') {
        console.log(`  ↳ Found child page: ${block.id}`)
        childPageIds.push(block.id)

        // Recursively crawl the child page
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

/**
 * Get all pages from a database that have isPage: true
 */
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

      // Check if this entry has isPage: true
      const isPage = properties.isPage?.checkbox || false

      if (isPage) {
        const title = properties.Title?.title?.[0]?.plain_text || properties.Name?.title?.[0]?.plain_text || 'Untitled'
        console.log(`  ✓ Found page: ${title} (${page.id})`)
        pageIds.push(page.id)

        // Crawl this page for nested pages
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

/**
 * Main crawler function
 */
async function crawlAllNotionPages() {
  console.log('='.repeat(60))
  console.log('Starting Notion page crawler...')
  console.log('='.repeat(60))

  const allPageIds = []

  // Crawl Timeline database
  const timelinePages = await getPagesFromDatabase(TIMELINE_DB_ID)
  allPageIds.push(...timelinePages)

  // Crawl Bookmarks database (if it has pages)
  const bookmarkPages = await getPagesFromDatabase(BOOKMARKS_DB_ID)
  allPageIds.push(...bookmarkPages)

  // Remove duplicates
  const uniquePageIds = [...new Set(allPageIds)]

  console.log('\n' + '='.repeat(60))
  console.log(`✓ Crawl complete! Found ${uniquePageIds.length} unique pages`)
  console.log('='.repeat(60))

  // Write to JSON file
  const outputPath = path.join(__dirname, '..', 'notion-pages.json')
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ pages: uniquePageIds, timestamp: new Date().toISOString() }, null, 2)
  )

  console.log(`\n✓ Saved to: ${outputPath}`)

  return uniquePageIds
}

// Run the crawler
if (require.main === module) {
  crawlAllNotionPages()
    .then((pages) => {
      console.log('\n✓ Crawler finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n✗ Crawler failed:', error)
      process.exit(1)
    })
}

module.exports = { crawlAllNotionPages }
