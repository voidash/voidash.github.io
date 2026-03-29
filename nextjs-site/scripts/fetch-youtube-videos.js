/**
 * Fetch YouTube videos from RSS feed
 * Runs at build time to pull latest videos without needing a YouTube API key.
 *
 * Usage: node scripts/fetch-youtube-videos.js
 * Output: public/data/videos.json
 */

const fs = require('fs')
const path = require('path')

const CHANNEL_ID = 'UCTvKsLycAQvka3TYTLj6Y4g' // @voidash
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`

function decodeXmlEntities(str) {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

async function main() {
  console.log(`Fetching YouTube RSS feed for channel ${CHANNEL_ID}...`)

  const res = await fetch(RSS_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch RSS feed: ${res.status} ${res.statusText}`)
  }

  const xml = await res.text()

  // YouTube RSS XML has a predictable structure — parse without external deps
  const entries = xml.split('<entry>').slice(1)

  const videos = entries
    .map((entry) => {
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
      const title = entry.match(/<title>([^<]+)<\/title>/)?.[1]
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1]
      // media:description can be multi-line
      const description =
        entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]?.trim() || ''

      if (!videoId) return null

      return {
        id: videoId,
        title: decodeXmlEntities(title),
        description: decodeXmlEntities(description).split('\n')[0].slice(0, 200),
        date: published ? published.split('T')[0] : '',
      }
    })
    .filter(Boolean)

  const outDir = path.join(__dirname, '..', 'public', 'data')
  fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, 'videos.json')
  fs.writeFileSync(outPath, JSON.stringify(videos, null, 2))

  console.log(`Wrote ${videos.length} videos to ${outPath}`)
}

main().catch((err) => {
  console.error('Error fetching YouTube videos:', err)
  process.exit(1)
})
