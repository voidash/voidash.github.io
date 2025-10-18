/**
 * Node.js compatible RSS parser
 */

async function fetchRecentBlogPosts(limit = 5) {
  try {
    const response = await fetch('https://ash9.dev/blog/index.xml', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse XML manually (simple parsing without external libs)
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    const posts = items.slice(0, limit).map((item) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1] ||
                   item.match(/<title>(.*?)<\/title>/s)?.[1] ||
                   'Untitled';

      const link = item.match(/<link>(.*?)<\/link>/s)?.[1] || '#';

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';

      const description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
                         item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
                         '';

      return {
        title: decodeHtmlEntities(title.trim()),
        link: link.trim(),
        pubDate: pubDate.trim(),
        description: stripHtml(description.trim()),
      };
    });

    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

function decodeHtmlEntities(text) {
  // Decode HTML entities multiple times to handle double-encoding
  for (let i = 0; i < 3; i++) {
    const before = text;

    // Decode numeric entities (decimal)
    text = text.replace(/&#(\d+);/g, (match, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return match;
      }
    });

    // Decode hex entities
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return match;
      }
    });

    // Decode basic named entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&ndash;/g, '\u2013')
      .replace(/&mdash;/g, '\u2014')
      .replace(/&hellip;/g, '\u2026')
      .replace(/&ldquo;/g, '\u201c')
      .replace(/&rdquo;/g, '\u201d')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rsquo;/g, '\u2019');

    // If nothing changed, we're done
    if (before === text) break;
  }

  return text.trim();
}

function stripHtml(html) {
  let text = html;

  // Strip HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode entities
  return decodeHtmlEntities(text);
}

module.exports = { fetchRecentBlogPosts };
