/**
 * RSS Feed Parser for Blog Posts
 * Fetches and parses RSS feed from blog
 */

export type BlogPost = {
  title: string
  link: string
  pubDate: string
  description: string
}

/**
 * Parse RSS XML feed to extract blog posts
 */
export async function fetchRecentBlogPosts(limit: number = 5): Promise<BlogPost[]> {
  try {
    const response = await fetch('https://ash9.dev/blog/index.xml', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`)
    }

    const xmlText = await response.text()

    // Parse XML manually (simple parsing without external libs)
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || []

    const posts: BlogPost[] = items.slice(0, limit).map((item) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1] ||
                   item.match(/<title>(.*?)<\/title>/s)?.[1] ||
                   'Untitled'

      const link = item.match(/<link>(.*?)<\/link>/s)?.[1] || '#'

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || ''

      // Match description with proper handling of multiline content
      // Use [\s\S] instead of . to match newlines, and make it non-greedy
      const description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
                         item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
                         ''

      return {
        title: title.trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        description: stripHtml(description.trim()),
      }
    })

    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

/**
 * Comprehensive HTML entity map for decoding
 */
const HTML_ENTITIES: Record<string, string> = {
  // Basic HTML entities
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",

  // Whitespace
  '&nbsp;': ' ',
  '&ensp;': ' ',
  '&emsp;': ' ',
  '&thinsp;': ' ',

  // Quotes and apostrophes
  '&ldquo;': '\u201c', // "
  '&rdquo;': '\u201d', // "
  '&lsquo;': '\u2018', // '
  '&rsquo;': '\u2019', // '
  '&sbquo;': '\u201a', // ‚
  '&bdquo;': '\u201e', // „
  '&prime;': '\u2032', // ′
  '&Prime;': '\u2033', // ″

  // Dashes and hyphens
  '&ndash;': '\u2013', // –
  '&mdash;': '\u2014', // —
  '&minus;': '\u2212', // −
  '&hyphen;': '\u2010', // ‐

  // Ellipsis and dots
  '&hellip;': '\u2026', // …
  '&middot;': '\u00b7', // ·

  // Currency
  '&cent;': '\u00a2', // ¢
  '&pound;': '\u00a3', // £
  '&euro;': '\u20ac', // €
  '&yen;': '\u00a5', // ¥
  '&dollar;': '$',

  // Math symbols
  '&times;': '\u00d7', // ×
  '&divide;': '\u00f7', // ÷
  '&plusmn;': '\u00b1', // ±
  '&ne;': '\u2260', // ≠
  '&le;': '\u2264', // ≤
  '&ge;': '\u2265', // ≥
  '&infin;': '\u221e', // ∞
  '&sum;': '\u2211', // ∑
  '&prod;': '\u220f', // ∏
  '&radic;': '\u221a', // √
  '&int;': '\u222b', // ∫
  '&part;': '\u2202', // ∂
  '&nabla;': '\u2207', // ∇
  '&perp;': '\u22a5', // ⊥
  '&forall;': '\u2200', // ∀
  '&exist;': '\u2203', // ∃
  '&empty;': '\u2205', // ∅
  '&isin;': '\u2208', // ∈
  '&notin;': '\u2209', // ∉
  '&ni;': '\u220b', // ∋
  '&cap;': '\u2229', // ∩
  '&cup;': '\u222a', // ∪
  '&sub;': '\u2282', // ⊂
  '&sup;': '\u2283', // ⊃
  '&sube;': '\u2286', // ⊆
  '&supe;': '\u2287', // ⊇

  // Arrows
  '&larr;': '\u2190', // ←
  '&uarr;': '\u2191', // ↑
  '&rarr;': '\u2192', // →
  '&darr;': '\u2193', // ↓
  '&harr;': '\u2194', // ↔
  '&crarr;': '\u21b5', // ↵
  '&lArr;': '\u21d0', // ⇐
  '&uArr;': '\u21d1', // ⇑
  '&rArr;': '\u21d2', // ⇒
  '&dArr;': '\u21d3', // ⇓
  '&hArr;': '\u21d4', // ⇔

  // Greek letters
  '&Alpha;': '\u0391', // Α
  '&Beta;': '\u0392', // Β
  '&Gamma;': '\u0393', // Γ
  '&Delta;': '\u0394', // Δ
  '&Epsilon;': '\u0395', // Ε
  '&Zeta;': '\u0396', // Ζ
  '&Eta;': '\u0397', // Η
  '&Theta;': '\u0398', // Θ
  '&Iota;': '\u0399', // Ι
  '&Kappa;': '\u039a', // Κ
  '&Lambda;': '\u039b', // Λ
  '&Mu;': '\u039c', // Μ
  '&Nu;': '\u039d', // Ν
  '&Xi;': '\u039e', // Ξ
  '&Omicron;': '\u039f', // Ο
  '&Pi;': '\u03a0', // Π
  '&Rho;': '\u03a1', // Ρ
  '&Sigma;': '\u03a3', // Σ
  '&Tau;': '\u03a4', // Τ
  '&Upsilon;': '\u03a5', // Υ
  '&Phi;': '\u03a6', // Φ
  '&Chi;': '\u03a7', // Χ
  '&Psi;': '\u03a8', // Ψ
  '&Omega;': '\u03a9', // Ω
  '&alpha;': '\u03b1', // α
  '&beta;': '\u03b2', // β
  '&gamma;': '\u03b3', // γ
  '&delta;': '\u03b4', // δ
  '&epsilon;': '\u03b5', // ε
  '&zeta;': '\u03b6', // ζ
  '&eta;': '\u03b7', // η
  '&theta;': '\u03b8', // θ
  '&iota;': '\u03b9', // ι
  '&kappa;': '\u03ba', // κ
  '&lambda;': '\u03bb', // λ
  '&mu;': '\u03bc', // μ
  '&nu;': '\u03bd', // ν
  '&xi;': '\u03be', // ξ
  '&omicron;': '\u03bf', // ο
  '&pi;': '\u03c0', // π
  '&rho;': '\u03c1', // ρ
  '&sigmaf;': '\u03c2', // ς
  '&sigma;': '\u03c3', // σ
  '&tau;': '\u03c4', // τ
  '&upsilon;': '\u03c5', // υ
  '&phi;': '\u03c6', // φ
  '&chi;': '\u03c7', // χ
  '&psi;': '\u03c8', // ψ
  '&omega;': '\u03c9', // ω

  // Misc symbols
  '&copy;': '\u00a9', // ©
  '&reg;': '\u00ae', // ®
  '&trade;': '\u2122', // ™
  '&deg;': '\u00b0', // °
  '&para;': '\u00b6', // ¶
  '&sect;': '\u00a7', // §
  '&dagger;': '\u2020', // †
  '&Dagger;': '\u2021', // ‡
  '&bull;': '\u2022', // •
  '&loz;': '\u25ca', // ◊
  '&spades;': '\u2660', // ♠
  '&clubs;': '\u2663', // ♣
  '&hearts;': '\u2665', // ♥
  '&diams;': '\u2666', // ♦
  '&frac14;': '\u00bc', // ¼
  '&frac12;': '\u00bd', // ½
  '&frac34;': '\u00be', // ¾
  '&permil;': '\u2030', // ‰
}

/**
 * Strip HTML tags and decode all HTML entities (including double-encoded)
 */
function stripHtml(html: string): string {
  let text = html

  // First, strip HTML tags
  text = text.replace(/<[^>]*>/g, '')

  // Decode entities multiple times to handle double-encoding (max 3 passes)
  for (let i = 0; i < 3; i++) {
    const before = text

    // Decode numeric entities (decimal: &#123;)
    text = text.replace(/&#(\d+);/g, (match, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10))
      } catch {
        return match
      }
    })

    // Decode hex entities (hex: &#x1A2B;)
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16))
      } catch {
        return match
      }
    })

    // Decode named entities using our comprehensive map
    text = text.replace(/&[a-zA-Z]+;/g, (entity) => {
      return HTML_ENTITIES[entity] || entity
    })

    // If nothing changed, we're done
    if (before === text) break
  }

  return text.trim()
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}
