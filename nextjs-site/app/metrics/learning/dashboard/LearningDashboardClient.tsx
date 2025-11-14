'use client'

import { useRouter } from 'next/navigation'
import { useLearningItems } from '@/lib/hooks/use-learning-items'
import { useAuth } from '@/lib/auth-context'
import { LearningItem } from '@/lib/learning-types'
import { formatInterval } from '@/lib/spaced-repetition'
import Link from 'next/link'

export default function LearningDashboardClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { allItems, dueItems, loading, deleteItem, suspendItem, unsuspendItem, getStats } = useLearningItems(user?.uid || null)

  const stats = getStats()

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
  }

  async function handleSuspend(itemId: string) {
    await suspendItem(itemId)
  }

  async function handleUnsuspend(itemId: string) {
    await unsuspendItem(itemId)
  }

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '10px' }}>Authentication Required</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          You must be logged in to view learning items.
        </p>
        <Link href="/metrics/login" style={{ color: '#0066cc', fontSize: '16px' }}>
          → Go to Login
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <Link
          href="/metrics/learning/review"
          style={{
            color: dueItems.length > 0 ? 'white' : '#0066cc',
            padding: '6px 12px',
            border: dueItems.length > 0 ? 'none' : '1px solid #0066cc',
            background: dueItems.length > 0 ? '#f59e0b' : 'transparent',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: dueItems.length > 0 ? '500' : 'normal',
          }}
        >
          {dueItems.length > 0 ? `Review ${dueItems.length} Items` : 'Review'}
        </Link>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>Learning Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Track your spaced repetition learning items
      </p>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#0066cc', marginBottom: '5px' }}>
            {stats.totalItems}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Items</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#22c55e', marginBottom: '5px' }}>
            {stats.newItems}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>New</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#f59e0b', marginBottom: '5px' }}>
            {stats.learningItems}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Learning</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#8b5cf6', marginBottom: '5px' }}>
            {stats.reviewItems}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Review</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#ef4444', marginBottom: '5px' }}>
            {stats.dueToday}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Due Today</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#06b6d4', marginBottom: '5px' }}>
            {stats.dueThisWeek}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Due This Week</div>
        </div>
      </div>

      {/* All Items Table */}
      <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>All Learning Items</h2>

        {allItems.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No learning items yet. Items tagged with #learn or #review in your daily logs will appear here.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Text</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Reps</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Interval</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Next Review</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Ease</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item) => {
                  const isDue = item.nextReviewDate <= new Date().toISOString().split('T')[0]
                  const statusColor =
                    item.status === 'new' ? '#22c55e' :
                    item.status === 'learning' ? '#f59e0b' :
                    item.status === 'review' ? '#8b5cf6' : '#6b7280'

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', maxWidth: '400px' }}>
                        <div style={{ fontWeight: isDue ? '600' : 'normal', color: isDue ? '#ef4444' : 'inherit' }}>
                          {item.text}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Source: {item.sourceDate} • {item.sourceType}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            background: statusColor,
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.repetitions}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {formatInterval(item.interval)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: isDue ? '#ef4444' : 'inherit', fontWeight: isDue ? '600' : 'normal' }}>
                        {item.nextReviewDate}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.easeFactor.toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {item.status !== 'suspended' ? (
                            <button
                              onClick={() => handleSuspend(item.id!)}
                              style={{
                                padding: '4px 8px',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                              title="Suspend this item"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnsuspend(item.id!)}
                              style={{
                                padding: '4px 8px',
                                background: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                              title="Resume this item"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id!)}
                            style={{
                              padding: '4px 8px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                            title="Delete this item"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
