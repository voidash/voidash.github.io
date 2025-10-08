export const NOTION_API_URL = 'https://cloudfare-notion-worker.ashish-thapa477.workers.dev'

export async function fetchNotionPage(pageId: string) {
  const res = await fetch(`${NOTION_API_URL}/v1/page/${pageId}`, {
    next: { revalidate: 18000 }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Notion page: ${pageId}`)
  }

  return res.json()
}

export async function fetchNotionTable(tableId: string) {
  const res = await fetch(`${NOTION_API_URL}/v1/table/${tableId}`, {
    next: { revalidate: 18000 }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Notion table: ${tableId}`)
  }

  return res.json()
}
