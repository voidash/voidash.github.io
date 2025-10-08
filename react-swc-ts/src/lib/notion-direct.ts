import { Client } from '@notionhq/client'

// You need to create a Notion integration and get the token from:
// https://www.notion.so/my-integrations
// Then add it to your environment variables as VITE_NOTION_TOKEN

export async function fetchNotionDatabase(databaseId: string) {
  // Check if token exists
  const token = import.meta.env.VITE_NOTION_TOKEN

  if (!token || token === 'your_notion_integration_token_here') {
    throw new Error('VITE_NOTION_TOKEN is not configured. Please add it to your .env file')
  }

  const notion = new Client({
    auth: token,
  })

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    })

    // Transform Notion API response to match your existing data structure
    const results = response.results.map((page: any) => {
      const properties = page.properties
      const transformed: any = {
        id: page.id,
      }

      // Transform each property based on its type
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
            transformed[key] = prop.multi_select.map((item: any) => item.name)
            break
          default:
            // Handle other types as needed
            break
        }
      })

      return transformed
    })

    return results
  } catch (error) {
    console.error('Error fetching Notion database:', error)
    throw new Error(`Failed to fetch Notion database: ${databaseId}`)
  }
}

export async function fetchNotionPage(pageId: string) {
  const token = import.meta.env.VITE_NOTION_TOKEN

  if (!token || token === 'your_notion_integration_token_here') {
    throw new Error('VITE_NOTION_TOKEN is not configured. Please add it to your .env file')
  }

  const notion = new Client({
    auth: token,
  })

  try {
    // Fetch page content using the Notion API
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    })

    return {
      blocks: response.results,
    }
  } catch (error) {
    console.error('Error fetching Notion page:', error)
    throw new Error(`Failed to fetch Notion page: ${pageId}`)
  }
}
