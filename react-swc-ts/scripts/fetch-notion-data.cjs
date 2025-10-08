const { Client } = require('@notionhq/client')
const fs = require('fs')
const path = require('path')

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.VITE_NOTION_TOKEN
const TIMELINE_DB_ID = '70bfec27eb6a4e11882b95e32bfdcdca'
const BOOKMARKS_DB_ID = '6fab1aca487d4d8c875e6625c5d01a0a'

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

async function main() {
  console.log('Fetching Notion data...')

  // Create public directory if it doesn't exist
  const publicDir = path.join(__dirname, '..', 'public', 'data')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
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

  console.log('\nData fetched successfully!')
}

main().catch((error) => {
  console.error('Failed to fetch Notion data:', error)
  process.exit(1)
})
