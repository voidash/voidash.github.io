import { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { ThemeToggle } from '@/components/ThemeToggle'
import './videos.css'

export const metadata: Metadata = {
  title: 'Videos - Ashish Thapa',
  description: 'Latest YouTube videos — documentaries, tech, Nepal politics',
}

type Video = {
  id: string
  title: string
  description: string
  date: string
}

function loadVideos(): Video[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'videos.json')
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    console.warn('videos.json not found — run: node scripts/fetch-youtube-videos.js')
    return []
  }
}

export default function VideosPage() {
  const VIDEOS = loadVideos()
  return (
    <>
      <ThemeToggle />
      <main className="videos-main">
        <nav className="videos-nav">
          <Link href="/">← Back to Home</Link>
        </nav>

        <h1>Videos</h1>
        <p className="videos-subtitle">
          YouTube:{' '}
          <a href="https://youtube.com/@voidash" target="_blank" rel="noopener noreferrer">
            @voidash
          </a>
        </p>

        <div className="videos-grid">
          {VIDEOS.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="video-card"
            >
              <div className="video-thumb">
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={video.title}
                  loading="lazy"
                />
                <div className="video-play">▶</div>
              </div>
              <div className="video-info">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
                <span className="video-date">{video.date}</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </>
  )
}
