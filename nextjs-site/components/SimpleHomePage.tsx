import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { BlogPost, formatDate } from '@/lib/rss-parser'

type BookmarkEntry = {
  Title: string
  id: string
  URL: string
  Description: string
  Tags: Array<string>
}

type SimpleHomePageProps = {
  recentPosts: BlogPost[]
  recentBookmarks: BookmarkEntry[]
}

export default function SimpleHomePage({ recentPosts, recentBookmarks }: SimpleHomePageProps) {
  return (
    <>
      <ThemeToggle />
      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>Voidash</h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            MEANING • PSYCHOLOGY • PHILOSOPHY • INNATE CURIOSITY
          </p>
          <pre style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '14px',
            color: 'var(--text-primary)',
            overflow: 'auto',
            display: 'inline-block',
            margin: 0
          }}>
            <code>curl voidash.github.io/dir</code>
          </pre>
        </header>

        <nav style={{ marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Navigation</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/about" style={{ fontSize: '18px', color: '#0066cc' }}>
                → About Me
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/timeline" style={{ fontSize: '18px', color: '#0066cc' }}>
                → Timeline / CV
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <a href="https://voidash.github.io/digitalgarden/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px', color: '#0066cc', textDecoration: 'none' }}>
                → Digital Garden
              </a>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <a href="https://voidash.github.io/digitalgarden/Experiments" target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px', color: '#0066cc', textDecoration: 'none' }}>
                → Experiments/Projects
              </a>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/bookmarks" style={{ fontSize: '18px', color: '#0066cc' }}>
                → Bookmarks
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/books" style={{ fontSize: '18px', color: '#0066cc' }}>
                → Books I Read
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/ask" style={{ fontSize: '18px', color: '#0066cc' }}>
                → Ask Me Anything
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/metrics" style={{ fontSize: '18px', color: '#0066cc' }}>
                → Life Metrics
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <a href="https://voidash.github.io/blog" target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px', color: '#0066cc', textDecoration: 'none' }}>
                → Blog
              </a>
            </li>
          </ul>
        </nav>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Socials</h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <a href="https://github.com/voidash" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', color: '#0066cc', textDecoration: 'none' }}>
              GitHub
            </a>
            <a href="https://x.com/rifeash" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', color: '#0066cc', textDecoration: 'none' }}>
              X/Twitter
            </a>
            <a href="https://www.instagram.com/voidash_" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', color: '#0066cc', textDecoration: 'none' }}>
              Instagram
            </a>
          </div>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            marginBottom: '20px'
          }}>
            {/* Recent Blog Posts Column */}
            <div>
              <h2 style={{ marginBottom: '20px' }}>Recent Blog Posts</h2>
              {recentPosts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No recent posts available.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recentPosts.map((post, index) => (
                      <article
                        key={index}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          paddingBottom: '20px',
                        }}
                      >
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '18px',
                            color: '#0066cc',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'block',
                            marginBottom: '8px',
                          }}
                        >
                          {post.title}
                        </a>
                        <time
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            display: 'block',
                            marginBottom: '8px',
                          }}
                        >
                          {formatDate(post.pubDate)}
                        </time>
                        {post.description && (
                          <p
                            style={{
                              fontSize: '15px',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.5',
                              margin: 0,
                            }}
                          >
                            {post.description.length > 150
                              ? `${post.description.substring(0, 150)}...`
                              : post.description}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                  <a
                    href="https://voidash.github.io/blog"
                    style={{
                      display: 'inline-block',
                      marginTop: '20px',
                      fontSize: '16px',
                      color: '#0066cc',
                      textDecoration: 'none',
                    }}
                  >
                    → View all posts
                  </a>
                </>
              )}
            </div>

            {/* Recent Bookmarks Column */}
            <div>
              <h2 style={{ marginBottom: '20px' }}>Recent Bookmarks</h2>
              {recentBookmarks.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No recent bookmarks available.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recentBookmarks.map((bookmark) => (
                      <article
                        key={bookmark.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          paddingBottom: '20px',
                        }}
                      >
                        <a
                          href={bookmark.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '18px',
                            color: '#0066cc',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'block',
                            marginBottom: '8px',
                          }}
                        >
                          {bookmark.Title}
                        </a>
                        {bookmark.Description && (
                          <p
                            style={{
                              fontSize: '15px',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.5',
                              margin: 0,
                              marginBottom: '8px',
                            }}
                          >
                            {bookmark.Description.length > 150
                              ? `${bookmark.Description.substring(0, 150)}...`
                              : bookmark.Description}
                          </p>
                        )}
                        {bookmark.Tags && bookmark.Tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {bookmark.Tags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '12px',
                                  padding: '2px 8px',
                                  background: 'var(--bg-secondary)',
                                  borderRadius: '4px',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                  <Link
                    href="/bookmarks"
                    style={{
                      display: 'inline-block',
                      marginTop: '20px',
                      fontSize: '16px',
                      color: '#0066cc',
                      textDecoration: 'none',
                    }}
                  >
                    → View all bookmarks
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '18px', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--text-primary)' }}>
            "Without music, life would be a mistake."
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '10px' }}>
            — Friedrich Nietzsche
          </p>
        </section>

        <section style={{ marginBottom: '40px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--text-primary)' }}>View Mode</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
            <a href="/spa" style={{ fontSize: '16px', color: '#0066cc', textDecoration: 'none' }}>
              SPA
            </a>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Simple (current)
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            <strong>Note:</strong> Single page mode has no feature parity with simple mode. SPA has OS like windows if you're into that.
          </p>
        </section>
      </main>
    </>
  )
}
