/**
 * Generate /dir endpoint as a static file
 * This script creates a plain text file that can be curled
 */

const fs = require('fs');
const path = require('path');

// Import the RSS parser and Notion fetcher
const { fetchRecentBlogPosts } = require('../lib/rss-parser-node.js');
const { fetchNotionDatabase } = require('../lib/notion-direct-node.js');

const BOOKMARKS_DB_ID = process.env.BOOKMARKS_DB_ID || '6fab1aca487d4d8c875e6625c5d01a0a';

async function generateDirFile() {
  try {
    console.log('Generating /dir static file...');

    // Fetch recent blog posts
    let recentPosts = [];
    try {
      recentPosts = await fetchRecentBlogPosts(3);
      console.log(`✓ Fetched ${recentPosts.length} blog posts`);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error.message);
    }

    // Fetch recent bookmarks
    let recentBookmarks = [];
    try {
      const allBookmarks = await fetchNotionDatabase(BOOKMARKS_DB_ID);
      recentBookmarks = allBookmarks.slice(0, 3);
      console.log(`✓ Fetched ${recentBookmarks.length} bookmarks`);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error.message);
    }

    // Generate plain text content
    const plainText = `Ashish Thapa
============

Email: ashish.thapa477@gmail.com

Socials:
  GitHub: https://github.com/voidash
  X/Twitter: https://x.com/rifeash
  Digital Garden: https://ash9.dev/digitalgarden/

Recent Blog Posts:
${recentPosts.length > 0
  ? recentPosts.map((post, i) => `  ${i + 1}. ${post.title}
     ${post.link}`).join('\n\n')
  : '  No recent posts available'}

Recent Bookmarks:
${recentBookmarks.length > 0
  ? recentBookmarks.map((bookmark, i) => `  ${i + 1}. ${bookmark.Title}
     ${bookmark.URL}`).join('\n\n')
  : '  No recent bookmarks available'}

---
Generated: ${new Date().toISOString()}`;

    // Create public directory if it doesn't exist
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to public/dir
    const dirPath = path.join(publicDir, 'dir');
    fs.writeFileSync(dirPath, plainText, 'utf8');

    console.log('✅ Successfully generated /dir file');
    console.log(`   Location: public/dir`);

  } catch (error) {
    console.error('Error generating dir file:', error);
    process.exit(1);
  }
}

generateDirFile();
