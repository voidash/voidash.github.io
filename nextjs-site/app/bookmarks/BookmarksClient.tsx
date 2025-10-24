'use client'

import { useState, useMemo } from 'react'
import './bookmarks.css'

type BookmarkEntry = {
  Title: string
  id: string
  URL: string
  Description: string
  Tags: Array<string>
}

type BookmarksClientProps = {
  bookmarks: BookmarkEntry[]
}

function getHostname(url: string): string {
  try {
    return url && url.trim() ? new URL(url).hostname : 'Invalid URL'
  } catch {
    return 'Invalid URL'
  }
}

export default function BookmarksClient({ bookmarks }: BookmarksClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  // Extract all unique tags from bookmarks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    bookmarks.forEach((bookmark) => {
      bookmark.Tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [bookmarks])

  // Filter bookmarks based on search and selected tags
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      // Search filter: check title, description, and URL
      const matchesSearch =
        searchQuery === '' ||
        bookmark.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.URL.toLowerCase().includes(searchQuery.toLowerCase())

      // Tag filter: if tags are selected, bookmark must have at least one
      const matchesTags =
        selectedTags.size === 0 ||
        bookmark.Tags.some((tag) => selectedTags.has(tag))

      return matchesSearch && matchesTags
    })
  }, [bookmarks, searchQuery, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags(new Set())
  }

  return (
    <>
      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '16px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            backgroundColor: 'var(--background)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>Filter by:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85em',
                  border: selectedTags.has(tag) ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: selectedTags.has(tag) ? '#0066cc' : 'transparent',
                  color: selectedTags.has(tag) ? '#ffffff' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontWeight: selectedTags.has(tag) ? '500' : 'normal',
                }}
              >
                {tag}
              </button>
            ))}
            {(selectedTags.size > 0 || searchQuery !== '') && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85em',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <div style={{ marginBottom: '12px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
        Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No bookmarks match your filters.
        </div>
      ) : (
        <div className="bookmarks">
          {filteredBookmarks.map((content) => (
            <div key={content.id}>
              <a className="card" href={content.URL} target="_blank" rel="noopener noreferrer">
                <div className="title">{content.Title}</div>
                <div className="urlBar">
                  {content.Tags.map((tag, i) => (
                    <div className="tags" key={i}>
                      <div className="tag">{tag}</div>
                    </div>
                  ))}
                </div>
                <span className="url">{getHostname(content.URL)}</span>
                <div className="description">{content.Description}</div>
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
