/**
 * Node.js compatible Notion fetcher
 */

const { Client } = require('@notionhq/client');

async function fetchNotionDatabase(databaseId) {
  if (!process.env.NOTION_TOKEN || process.env.NOTION_TOKEN === 'your_notion_integration_token_here') {
    throw new Error('NOTION_TOKEN is not configured');
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const response = await notion.databases.query({
      database_id: databaseId.replace(/-/g, ''),
      page_size: 100,
    });

    const results = response.results.map((page) => {
      const properties = page.properties;
      const transformed = {
        id: page.id,
      };

      Object.keys(properties).forEach((key) => {
        const prop = properties[key];

        switch (prop.type) {
          case 'title':
            transformed[key] = prop.title?.[0]?.plain_text || '';
            break;
          case 'rich_text':
            transformed[key] = prop.rich_text?.[0]?.plain_text || '';
            break;
          case 'date':
            if (prop.date) {
              transformed.StartDate = prop.date.start;
              transformed.EndDate = prop.date.end;
            }
            break;
          case 'checkbox':
            transformed[key] = prop.checkbox;
            break;
          case 'url':
            transformed[key] = prop.url || '';
            break;
          case 'multi_select':
            transformed[key] = prop.multi_select.map((item) => item.name);
            break;
          default:
            break;
        }
      });

      return transformed;
    });

    return results;
  } catch (error) {
    console.error('Error fetching Notion database:', error);
    throw new Error(`Failed to fetch Notion database: ${databaseId}`);
  }
}

module.exports = { fetchNotionDatabase };
