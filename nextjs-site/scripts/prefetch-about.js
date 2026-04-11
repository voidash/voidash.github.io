/**
 * Pre-fetch the About Me page data from the Cloudflare Notion worker.
 * Saves the result as a local JSON file so the Next.js build doesn't
 * depend on the worker being reachable from CI.
 *
 * Usage: node scripts/prefetch-about.js
 */

const fs = require('fs')
const path = require('path')

const NOTION_WORKER_URL = 'https://cloudfare-notion-worker.ashish-thapa477.workers.dev'
const ABOUT_PAGE_ID = 'About-Me-3aec394784ab48dd90fbe44b948a7da9'
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'about-notion.json')
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, retries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`  Attempt ${attempt}/${retries}: fetching ${url}`)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()

      // Validate that the response has actual block content
      const keys = Object.keys(data)
      if (keys.length === 0) {
        throw new Error('Notion worker returned empty object')
      }

      // The worker returns { blockId: { value: { value: { type, properties, ... } } } }
      // Check that we have more than just the page block and that blocks have types
      const blockTypes = keys.map(k => data[k]?.value?.value?.type).filter(Boolean)
      if (blockTypes.length < 2) {
        throw new Error(`Notion worker returned ${keys.length} keys but only ${blockTypes.length} valid blocks`)
      }

      // The worker returns { id: { spaceId, value: { value: {...}, role } } }
      // but react-notion expects { id: { value: {...} } }
      // Flatten by promoting value.value to value
      const flattened = {}
      for (const [id, block] of Object.entries(data)) {
        if (block.value && block.value.value) {
          flattened[id] = { value: block.value.value }
        } else {
          flattened[id] = block
        }
      }
      return flattened
    } catch (err) {
      console.error(`  ✗ Attempt ${attempt} failed: ${err.message}`)
      if (attempt < retries) {
        console.log(`  Retrying in ${RETRY_DELAY_MS}ms...`)
        await sleep(RETRY_DELAY_MS)
      }
    }
  }
  throw new Error(`Failed to fetch about page after ${retries} attempts`)
}

async function main() {
  console.log('Prefetching About Me page from Notion worker...')

  const data = await fetchWithRetry(`${NOTION_WORKER_URL}/v1/page/${ABOUT_PAGE_ID}`, MAX_RETRIES)

  const dir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2))
  console.log(`✓ Saved about page data (${Object.keys(data).length} blocks) to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(`\n✗ Prefetch failed: ${err.message}`)
  process.exit(1)
})
