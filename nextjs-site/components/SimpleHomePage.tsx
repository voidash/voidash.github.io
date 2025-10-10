import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { BlogPost, formatDate } from '@/lib/rss-parser'

type SimpleHomePageProps = {
  recentPosts: BlogPost[]
}

export default function SimpleHomePage({ recentPosts }: SimpleHomePageProps) {
  return (
    <>
      <ThemeToggle />
      <main style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>Ashish Thapa</h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            MEANING • PSYCHOLOGY • PHILOSOPHY • INNATE CURIOSITY
          </p>
        </header>

        <section style={{ marginBottom: '40px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--text-primary)' }}>View Mode</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <a href="/spa" style={{ fontSize: '16px', color: '#0066cc', textDecoration: 'none' }}>
              SPA
            </a>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Simple (current)
            </span>
          </div>
        </section>

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
                → Timeline
              </Link>
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
              <a href="https://voidash.github.io/blog" style={{ fontSize: '18px', color: '#0066cc', textDecoration: 'none' }}>
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
          <h2 style={{ marginBottom: '20px' }}>Recent Blog Posts</h2>
          {recentPosts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No recent posts available.</p>
          ) : (
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
          )}
          <a
            href="https://thapa-ashish.com.np/blog"
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
        </section>

        <section style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Welcome to my portfolio. This site showcases my work, thoughts, and projects.
            Navigate using the links above to explore different sections.
          </p>
        </section>
      </main>
    </>
  )
}
