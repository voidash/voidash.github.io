# Next.js Portfolio Site

Static portfolio site built with Next.js 15, using Notion as a CMS and Firebase for the AMA feature.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Add environment variables (create .env.local)
NOTION_TOKEN=your_token_here
TIMELINE_DB_ID=your_timeline_db_id
BOOKMARKS_DB_ID=your_bookmarks_db_id

# Run development server
npm run dev
```

### Static Build for Production

```bash
# 1. Crawl Notion pages
NOTION_TOKEN=xxx TIMELINE_DB_ID=xxx BOOKMARKS_DB_ID=xxx node scripts/crawl-notion.js

# 2. Build static site
NOTION_TOKEN=xxx TIMELINE_DB_ID=xxx BOOKMARKS_DB_ID=xxx npm run build

# 3. Test locally
npx serve out
```

## Architecture

### Static Generation (GitHub Pages)
- **Build time**: Crawls Notion, fetches all content, generates static HTML
- **Runtime**: Pure static files, no API calls
- **Updates**: Daily automatic rebuilds via GitHub Actions

### Routes
- `/` - Home page
- `/timeline` - Timeline from Notion database
- `/bookmarks` - Bookmarks from Notion database
- `/ama` - Ask Me Anything (Firebase)
- `/admin` - Admin panel for AMA (Firebase Auth)
- `/notion/[id]` - Dynamic Notion pages (statically generated)

### Key Files
- `scripts/crawl-notion.js` - Discovers all Notion pages at build time
- `notion-pages.json` - Generated list of pages to build (gitignored)
- `.github/workflows/deploy.yml` - Daily rebuild and deployment

## Deployment

Site automatically deploys to GitHub Pages:
- **Daily** at midnight UTC
- On **push** to main branch
- **Manual** trigger via GitHub Actions

### Required GitHub Secrets
```
NOTION_TOKEN
TIMELINE_DB_ID
BOOKMARKS_DB_ID
```

### Domain
Deployed at: `ash9.dev` (with GitHub Pages at `voidash.github.io`)

## Documentation

- [BUILD.md](./BUILD.md) - Detailed build instructions
- [NOTION_SETUP.md](./NOTION_SETUP.md) - Notion API setup (legacy, for reference)
