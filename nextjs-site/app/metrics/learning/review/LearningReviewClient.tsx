'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLearningItems } from '@/lib/hooks/use-learning-items'
import { useAuth } from '@/lib/auth-context'
import { DifficultyRating, LearningItem } from '@/lib/learning-types'
import { getIntervalPreview, formatInterval } from '@/lib/spaced-repetition'
import Link from 'next/link'

export default function LearningReviewClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { dueItems, loading, reviewItem, getStats } = useLearningItems(user?.uid || null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)

  const currentItem = dueItems[currentIndex]
  const stats = getStats()

  async function handleRating(rating: DifficultyRating) {
    if (!currentItem?.id) return

    const success = await reviewItem(currentItem.id, rating)
    if (success) {
      setReviewedCount(prev => prev + 1)

      // Move to next item or finish
      if (currentIndex < dueItems.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        // Finished all reviews
        setCurrentIndex(0)
      }
    }
  }

  function getIntervalPreviews() {
    if (!currentItem) return null
    return getIntervalPreview(currentItem)
  }

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '10px' }}>Authentication Required</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          You must be logged in to review learning items.
        </p>
        <Link href="/metrics/login" style={{ color: '#0066cc', fontSize: '16px' }}>
          → Go to Login
        </Link>
      </div>
    )
  }

  if (dueItems.length === 0) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <nav style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link href="/metrics" style={{ color: '#0066cc' }}>
            ← Back to Metrics
          </Link>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <Link href="/metrics/learning/dashboard" style={{ color: '#0066cc' }}>
            Dashboard
          </Link>
        </nav>

        <h1 style={{ marginBottom: '10px' }}>No Reviews Due!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Great job! You've completed all reviews for today.
        </p>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Learning Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#0066cc' }}>{stats.totalItems}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Items</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#22c55e' }}>{stats.newItems}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>New</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>{stats.learningItems}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Learning</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#8b5cf6' }}>{stats.reviewItems}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Review</div>
            </div>
          </div>
        </div>

        <Link href="/metrics/learning/dashboard" style={{ color: '#0066cc' }}>
          → View All Learning Items
        </Link>
      </div>
    )
  }

  const intervalPreviews = getIntervalPreviews()

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <Link href="/metrics/learning/dashboard" style={{ color: '#0066cc' }}>
          Dashboard
        </Link>
      </nav>

      {/* Progress */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          {reviewedCount} reviewed • {dueItems.length - currentIndex} remaining
        </div>
        <div style={{ background: 'var(--border-color)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              background: '#0066cc',
              height: '100%',
              width: `${(reviewedCount / (dueItems.length + reviewedCount)) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          borderRadius: '12px',
          padding: '40px',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ fontSize: '20px', lineHeight: '1.6', textAlign: 'center', marginBottom: '20px' }}>
          {currentItem.text}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          Source: {currentItem.sourceDate} • {currentItem.sourceType === 'learn' ? 'Learning' : 'Review'} •
          Status: {currentItem.status} • Reps: {currentItem.repetitions}
        </div>

        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
          How well did you remember this?
        </div>
      </div>

      {/* Difficulty Buttons */}
      {intervalPreviews && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <button
            onClick={() => handleRating('again')}
            style={{
              padding: '16px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div>Again</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{formatInterval(intervalPreviews.again)}</div>
          </button>

          <button
            onClick={() => handleRating('hard')}
            style={{
              padding: '16px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div>Hard</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{formatInterval(intervalPreviews.hard)}</div>
          </button>

          <button
            onClick={() => handleRating('good')}
            style={{
              padding: '16px 12px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div>Good</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{formatInterval(intervalPreviews.good)}</div>
          </button>

          <button
            onClick={() => handleRating('easy')}
            style={{
              padding: '16px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div>Easy</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{formatInterval(intervalPreviews.easy)}</div>
          </button>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
        Tip: You can use keyboard shortcuts 1-4 for ratings (coming soon)
      </div>
    </div>
  )
}
