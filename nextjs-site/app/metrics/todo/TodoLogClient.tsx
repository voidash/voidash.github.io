'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { TodoSnapshot } from '@/lib/metrics-types'
import Link from 'next/link'

export default function TodoLogClient() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [label, setLabel] = useState<'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'>('learning')
  const [openCount, setOpenCount] = useState(0)
  const [addedCount, setAddedCount] = useState(0)
  const [closedCount, setClosedCount] = useState(0)

  const [status, setStatus] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Saving...')

    try {
      // Check if snapshot already exists for this date+label
      const q = query(
        collection(db, 'todo_snapshots'),
        where('date', '==', date),
        where('label', '==', label)
      )
      const existing = await getDocs(q)

      if (!existing.empty) {
        setStatus('Error: Todo snapshot already exists for this date and label')
        return
      }

      const todoData: TodoSnapshot = {
        date,
        label,
        openCount,
        addedCount,
        closedCount,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'todo_snapshots'), todoData)
      setStatus('✓ Saved')

      // Reset counts but keep date and label
      setOpenCount(0)
      setAddedCount(0)
      setClosedCount(0)

      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error saving todo snapshot:', error)
      setStatus('Error saving snapshot')
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>Todo Tracking</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Weekly snapshots for each todo category (take one snapshot per label per week, typically on Sunday)
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Date (typically end of week)
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Category
          </label>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="learning">Learning</option>
            <option value="producer">Producer</option>
            <option value="finance">Finance</option>
            <option value="fitness">Fitness</option>
            <option value="relationship">Relationship</option>
          </select>
        </div>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3 style={{ marginBottom: '15px' }}>Todo Snapshot</h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Open at start of week
          </label>
          <input
            type="number"
            min="0"
            value={openCount}
            onChange={(e) => setOpenCount(parseInt(e.target.value) || 0)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Added during week
          </label>
          <input
            type="number"
            min="0"
            value={addedCount}
            onChange={(e) => setAddedCount(parseInt(e.target.value) || 0)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Closed during week
          </label>
          <input
            type="number"
            min="0"
            value={closedCount}
            onChange={(e) => setClosedCount(parseInt(e.target.value) || 0)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          <strong>Net change:</strong> {closedCount - addedCount}
          <br />
          <strong>Backlog health:</strong>{' '}
          {closedCount > addedCount ? (
            <span style={{ color: '#22c55e' }}>Good (closing faster than adding)</span>
          ) : closedCount === addedCount ? (
            <span style={{ color: '#eab308' }}>Neutral</span>
          ) : (
            <span style={{ color: '#ef4444' }}>Bad (backlog growing)</span>
          )}
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Save Todo Snapshot
        </button>

        {status && (
          <p
            style={{
              marginTop: '15px',
              textAlign: 'center',
              color: status.includes('Error') ? '#ef4444' : '#22c55e',
            }}
          >
            {status}
          </p>
        )}
      </form>
    </div>
  )
}
