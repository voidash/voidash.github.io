# Build Instructions

This site uses static site generation with Notion as a CMS.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
NOTION_TOKEN=your_notion_integration_token
TIMELINE_DB_ID=your_timeline_database_id
BOOKMARKS_DB_ID=your_bookmarks_database_id
```

3. Run development server:
```bash
npm run dev
```

## Building for Production

### Step 1: Crawl Notion Pages

First, discover all Notion pages that need to be statically generated:

```bash
node scripts/crawl-notion.js
```

This creates `notion-pages.json` with all discovered page IDs.

### Step 2: Build Static Site

```bash
npm run build
```

This generates static HTML in the `out/` directory.

### Step 3: Test Locally

```bash
npx serve out
```

## Deployment

### GitHub Actions (Automatic)

The site automatically rebuilds and deploys:
- **Daily** at midnight UTC
- On **push** to main branch
- **Manual** trigger via GitHub Actions UI

### GitHub Secrets Required

Add these secrets in your repository settings:
- `NOTION_TOKEN` - Your Notion integration token
- `TIMELINE_DB_ID` - Timeline database ID
- `BOOKMARKS_DB_ID` - Bookmarks database ID

### Manual Deploy

```bash
# Crawl and build
node scripts/crawl-notion.js
npm run build

# Deploy to GitHub Pages
# (or use the GitHub Actions workflow)
```

## How It Works

1. **Crawler Script** (`scripts/crawl-notion.js`):
   - Fetches all pages from Timeline and Bookmarks databases
   - Recursively discovers child pages
   - Outputs `notion-pages.json`

2. **Next.js Build**:
   - Reads `notion-pages.json`
   - Generates static HTML for each page
   - Fetches content from Notion API at build time
   - Outputs to `out/` directory

3. **GitHub Pages**:
   - Serves static files from `gh-pages` branch
   - No server required
   - Firebase SDK runs client-side for AMA

## Firebase (AMA)

The AMA feature uses client-side Firebase and works fine with static hosting:
- Questions/answers load dynamically via JavaScript
- No server-side rendering needed
- Firebase config is in `lib/firebase.ts`

## Troubleshooting

### notion-pages.json not found
Run the crawler: `node scripts/crawl-notion.js`

### Build fails with Notion API errors
Check that:
- `NOTION_TOKEN` is valid
- Database IDs are correct
- Databases are shared with your Notion integration

### Pages not appearing
1. Verify pages have `isPage: true` checkbox in Notion
2. Re-run crawler
3. Rebuild site
