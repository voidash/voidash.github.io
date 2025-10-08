# Notion API Setup Guide for react-swc-ts

The timeline and bookmarks pages now use the official Notion API instead of the Cloudflare Worker.

## Setup Steps

### 1. Create a Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name (e.g., "Portfolio Website")
4. Select the workspace where your databases are
5. Click "Submit"
6. Copy the "Internal Integration Token" (starts with `secret_`)

### 2. Share Your Databases with the Integration

For each database (Timeline and Bookmarks):

1. Open the database in Notion
2. Click the "..." menu in the top right
3. Scroll to "Connections"
4. Click "Connect to" and select your integration

You need to do this for:
- **Timeline Database**: `70bfec27eb6a4e11882b95e32bfdcdca`
- **Bookmarks Database**: `6fab1aca487d4d8c875e6625c5d01a0a`

### 3. Add the Token to Your Environment

Edit `.env` and replace `your_notion_integration_token_here` with your actual token:

```bash
VITE_NOTION_TOKEN=secret_your_actual_token_here
VITE_TIMELINE_DB_ID=70bfec27eb6a4e11882b95e32bfdcdca
VITE_BOOKMARKS_DB_ID=6fab1aca487d4d8c875e6625c5d01a0a
```

**Note:** Vite uses the `VITE_` prefix for environment variables that are exposed to the client.

### 4. Restart the Dev Server

```bash
npm run dev
```

## Database Structure Requirements

### Timeline Database
Required properties:
- **Title** (title) - Event title
- **Description** (rich_text) - Event description
- **Date** (date) - Start and optional end date
- **isPage** (checkbox) - Whether this has a detail page

### Bookmarks Database
Required properties:
- **Title** (title) - Bookmark title
- **URL** (url) - Link URL
- **Description** (rich_text) - Description
- **Tags** (multi_select) - Tags like "blog", "advice", "video"

## Troubleshooting

- **401 Unauthorized**: Check that your `VITE_NOTION_TOKEN` is correct
- **404 Not Found**: Ensure you've shared the database with your integration
- **Empty data**: Verify the property names match exactly (case-sensitive)
- **Token not found**: Make sure you restart the dev server after updating `.env`

## Benefits Over Cloudflare Worker

- ✅ Direct access to Notion API (no middleware)
- ✅ Official SDK with better error handling
- ✅ No external dependencies on your Worker
- ✅ Better TypeScript support
- ✅ Easier debugging
