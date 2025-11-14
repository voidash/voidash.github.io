'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDailyLog } from '@/lib/hooks/use-daily-log'
import { useLearningItems } from '@/lib/hooks/use-learning-items'
import { parseMarkdownTasks } from '@/lib/task-parser'
import { useAuth } from '@/lib/auth-context'
import { DifficultyRating } from '@/lib/learning-types'
import { getIntervalPreview, formatInterval } from '@/lib/spaced-repetition'
import Link from 'next/link'

export default function DailyLogAddClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')

  const {
    date,
    logged,
    tasksMarkdown,
    gymSession,
    weight,
    caloriesTracked,
    status,
    existingLogId,
    weeklyLog,
    previousDayLog,
    taskStats,
    setDate,
    setLogged,
    setTasksMarkdown,
    setGymSession,
    setWeight,
    setCaloriesTracked,
    saveLog,
  } = useDailyLog(user?.uid || null, dateParam || undefined)

  const { dueItems, reviewItem, getStats } = useLearningItems(user?.uid || null)
  const learningStats = getStats()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const success = await saveLog()
    if (success) {
      // Optionally redirect to logs view or stay on the form
    }
  }

  async function handleReviewRating(itemId: string, rating: DifficultyRating) {
    await reviewItem(itemId, rating)
  }

  if (authLoading) {
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
          You must be logged in to log daily metrics.
        </p>
        <Link href="/metrics/login" style={{ color: '#0066cc', fontSize: '16px' }}>
          → Go to Login
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <Link
          href="/metrics/daily/logs"
          style={{
            color: '#0066cc',
            padding: '6px 12px',
            border: '1px solid #0066cc',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          View All Logs
        </Link>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>
        {existingLogId ? 'Edit Daily Log' : 'Add Daily Log'}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Track your day with markdown checkboxes and tags
      </p>

      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          fontSize: '14px',
        }}
      >
        <strong>How to use tags:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li><code>#learn</code> - learning artifacts (papers, code, proofs)</li>
          <li><code>#review</code> - revision points reviewed</li>
          <li><code>#new-review</code> - new revision notes created</li>
          <li><code>#produce</code> - public outputs (blog, project, etc.)</li>
          <li><code>#relationship</code> - new interactions</li>
          <li><code>#family</code> - family calls</li>
          <li><code>#conflict-resolved</code> / <code>#conflict-unresolved</code></li>
          <li><code>#learning-todo</code>, <code>#producer-todo</code>, <code>#finance-todo</code>, <code>#fitness-todo</code>, <code>#relationship-todo</code> - add to backlog</li>
        </ul>
      </div>

      {/* Learning Items Due for Review */}
      {dueItems.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
              Review ({dueItems.length})
            </h3>
            <Link
              href="/metrics/learning/review"
              style={{
                color: '#0066cc',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Full page →
            </Link>
          </div>

          {/* Review Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dueItems.map((item) => {
              const intervalPreviews = getIntervalPreview(item)
              return (
                <div
                  key={item.id}
                  style={{
                    borderLeft: '3px solid var(--border-color)',
                    paddingLeft: '12px',
                  }}
                >
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {item.text}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      onClick={() => handleReviewRating(item.id!, 'again')}
                      style={{
                        padding: '8px 6px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Again
                      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                        {formatInterval(intervalPreviews.again)}
                      </div>
                    </button>

                    <button
                      onClick={() => handleReviewRating(item.id!, 'hard')}
                      style={{
                        padding: '8px 6px',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Hard
                      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                        {formatInterval(intervalPreviews.hard)}
                      </div>
                    </button>

                    <button
                      onClick={() => handleReviewRating(item.id!, 'good')}
                      style={{
                        padding: '8px 6px',
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Good
                      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                        {formatInterval(intervalPreviews.good)}
                      </div>
                    </button>

                    <button
                      onClick={() => handleReviewRating(item.id!, 'easy')}
                      style={{
                        padding: '8px 6px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Easy
                      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                        {formatInterval(intervalPreviews.easy)}
                      </div>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={logged}
              onChange={(e) => setLogged(e.target.checked)}
            />
            <span>Day logged</span>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Tasks (markdown with checkboxes)
          </label>
          <textarea
            value={tasksMarkdown}
            onChange={(e) => setTasksMarkdown(e.target.value)}
            placeholder="- [x] Read paper on distributed systems #learn&#10;- [ ] Review algorithms flashcards #review&#10;- [x] Ship blog post #produce"
            style={{
              width: '100%',
              minHeight: '300px',
              padding: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Weekly Log Context */}
        {weeklyLog && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>📅 This Week's Focus</h3>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Week of {weeklyLog.weekStart}
            </div>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '13px',
                margin: 0,
                lineHeight: '1.6',
              }}
            >
              {weeklyLog.tasksMarkdown}
            </pre>
          </div>
        )}

        {/* Previous Day Context */}
        {previousDayLog && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>⏮️ Previous Day</h3>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {previousDayLog.date}
              {(() => {
                const tasks = parseMarkdownTasks(previousDayLog.tasksMarkdown)
                const completed = tasks.filter(t => t.completed).length
                return ` • ${completed}/${tasks.length} tasks completed`
              })()}
            </div>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '13px',
                margin: 0,
                lineHeight: '1.6',
              }}
            >
              {previousDayLog.tasksMarkdown}
            </pre>
          </div>
        )}

        {/* Stats Preview */}
        {taskStats && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            <strong>Stats Preview:</strong>
            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              <div>✓ {taskStats.completedTasks}/{taskStats.totalTasks} tasks completed</div>
              {taskStats.learningArtifacts > 0 && <div>📚 {taskStats.learningArtifacts} learning artifacts</div>}
              {taskStats.revisionNotesCreated > 0 && <div>📝 {taskStats.revisionNotesCreated} new revision notes</div>}
              {taskStats.revisionPointsReviewed > 0 && <div>🔄 {taskStats.revisionPointsReviewed} revision points reviewed</div>}
              {taskStats.publicOutputs > 0 && <div>🚀 {taskStats.publicOutputs} public outputs</div>}
              {taskStats.newInteractions > 0 && <div>👥 {taskStats.newInteractions} new interactions</div>}
              {taskStats.familyCalls > 0 && <div>📞 {taskStats.familyCalls} family calls</div>}
              {taskStats.conflictsResolved > 0 && <div>✅ {taskStats.conflictsResolved} conflicts resolved</div>}
              {taskStats.unresolvedConflicts > 0 && <div>⚠️ {taskStats.unresolvedConflicts} unresolved conflicts</div>}
              {taskStats.todosAdded > 0 && <div>📋 {taskStats.todosAdded} todos will be added</div>}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={gymSession}
              onChange={(e) => setGymSession(e.target.checked)}
            />
            <span>Gym session</span>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Weight (kg) - optional
          </label>
          <input
            type="number"
            step="0.1"
            value={weight || ''}
            onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="70.5"
            style={{
              width: '150px',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={caloriesTracked}
              onChange={(e) => setCaloriesTracked(e.target.checked)}
            />
            <span>Calories tracked</span>
          </label>
        </div>

        <button
          type="submit"
          style={{
            padding: '12px 24px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '16px',
          }}
        >
          {existingLogId ? 'Update Log' : 'Save Log'}
        </button>

        {status && (
          <span
            style={{
              marginLeft: '15px',
              color: status.includes('Error') ? '#ef4444' : '#22c55e',
            }}
          >
            {status}
          </span>
        )}
      </form>
    </div>
  )
}
