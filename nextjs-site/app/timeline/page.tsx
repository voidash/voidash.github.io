import { fetchNotionDatabase } from '@/lib/notion-direct'
import { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import './timeline.css'

const TIMELINE_DB_ID = process.env.TIMELINE_DB_ID || '70bfec27eb6a4e11882b95e32bfdcdca'

export const metadata: Metadata = {
  title: 'Timeline - Ashish Thapa',
  description: 'Timeline of My Life',
}

export const revalidate = 18000

type TimelineEvent = {
  id: string
  Title: string
  Description: string
  StartDate: string
  EndDate: string
  isPage: boolean
}

export default async function TimelinePage() {
  let timelineData: TimelineEvent[] = []
  let error: string | null = null

  try {
    timelineData = await fetchNotionDatabase(TIMELINE_DB_ID) as TimelineEvent[]
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load timeline data'
    console.error('Timeline fetch error:', e)
  }

  const sortedTimeline = timelineData.sort((a, b) => {
    const d1 = new Date(a.StartDate)
    const d2 = new Date(b.StartDate)
    return d1 > d2 ? 1 : -1
  })

  return (
    <>
      <ThemeToggle />
      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#0066cc', fontSize: '16px' }}>
            ← Back to Home
          </Link>
        </nav>

        <h1 style={{ marginBottom: '40px' }}>My Timeline</h1>

        {error && (
          <div style={{ padding: '20px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', borderRadius: '5px', marginBottom: '20px' }}>
            <p>⚠️ Unable to load timeline data. The Notion API may be temporarily unavailable.</p>
            <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {sortedTimeline.length === 0 && !error && (
          <p>Loading timeline data...</p>
        )}

        <ul className="timeline">
          {sortedTimeline.map((ev) => (
            <li key={ev.id}>
              <div className="event-header">
                <h2 className="event-title">{ev.Title}</h2>
                <span className="event-date">
                  {ev.StartDate}{ev.EndDate ? ` → ${ev.EndDate}` : ""}
                </span>
              </div>
              <div className="event-description">{ev.Description}</div>
              {ev.isPage && (
                <Link href={`/notion/${ev.id}`} className="event-link">
                  Learn More →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
