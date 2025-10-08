import Link from 'next/link'

export default function SimpleHomePage() {
  return (
    <main style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>Ashish Thapa</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          MEANING • PSYCHOLOGY • PHILOSOPHY • INNATE CURIOSITY
        </p>
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
              → Timeline
            </Link>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <Link href="/bookmarks" style={{ fontSize: '18px', color: '#0066cc' }}>
              → Bookmarks
            </Link>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <Link href="/ask" style={{ fontSize: '18px', color: '#0066cc' }}>
              → Ask Me Anything
            </Link>
          </li>
        </ul>
      </nav>

      <section style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Welcome to my portfolio. This site showcases my work, thoughts, and projects.
          Navigate using the links above to explore different sections.
        </p>
      </section>
    </main>
  )
}
