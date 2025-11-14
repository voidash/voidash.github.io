'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useWeeklyLog } from '@/lib/hooks/use-weekly-log'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function WeeklyLogAddClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const weekStartParam = searchParams.get('weekStart')

  const {
    weekStart,
    weekEnd,
    tasksMarkdown,
    targetWeight,
    primaryRelationshipActive,
    financeConceptApplied,
    portfolioReview,
    status,
    existingLogId,
    isSaving,
    taskStats,
    setWeekStart,
    setWeekEnd,
    setTasksMarkdown,
    setTargetWeight,
    setPrimaryRelationshipActive,
    setFinanceConceptApplied,
    setPortfolioReview,
    setManualWeekEnd,
    saveLog,
  } = useWeeklyLog(user?.uid || null, weekStartParam || undefined)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const success = await saveLog()
    if (success) {
      // Optionally redirect to logs view or stay on the form
    }
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
          You must be logged in to log weekly metrics.
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
          href="/metrics/weekly/logs"
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
        {existingLogId ? 'Edit Weekly Log' : 'Add Weekly Log'}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Set weekly goals and parameters
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Week Starting
            </label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => {
                setWeekStart(e.target.value)
                setManualWeekEnd(false)
              }}
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
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Week Ending
            </label>
            <input
              type="date"
              value={weekEnd}
              onChange={(e) => {
                setWeekEnd(e.target.value)
                setManualWeekEnd(true)
              }}
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
        </div>
        {weekEnd && weekStart && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Week duration: {Math.ceil((new Date(weekEnd).getTime() - new Date(weekStart).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
          </p>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Weekly Goals & Plans (Markdown)
          </label>
          <textarea
            value={tasksMarkdown}
            onChange={(e) => setTasksMarkdown(e.target.value)}
            placeholder={`- [ ] Complete 3 learning artifacts this week
- [ ] Publish 1 blog post
- [ ] Apply new finance concept #finance-concept
- [ ] Review investment portfolio #portfolio-review
- [ ] Hit gym 3 times
- [ ] Call family twice
- [ ] Meet 3 new people`}
            rows={12}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'vertical',
            }}
          />
        </div>

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
              {taskStats.financeConceptApplied !== 'none' && (
                <div>💰 Finance concept: {taskStats.financeConceptApplied}</div>
              )}
              {taskStats.portfolioReview !== 'none' && (
                <div>📊 Portfolio: {taskStats.portfolioReview}</div>
              )}
            </div>
          </div>
        )}

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3 style={{ marginBottom: '15px' }}>Fitness</h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Target weight for end of week (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={targetWeight}
            onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Your target weight by the end of this week. Actual weight is calculated from daily log entries.
          </p>
        </div>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3 style={{ marginBottom: '15px' }}>Finance</h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Finance concept applied
          </label>
          <select
            value={financeConceptApplied}
            onChange={(e) => setFinanceConceptApplied(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="none">None</option>
            <option value="noted">Noted</option>
            <option value="implemented">Implemented</option>
          </select>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Did you learn and apply a new finance concept this week?
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Portfolio review
          </label>
          <select
            value={portfolioReview}
            onChange={(e) => setPortfolioReview(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="none">None</option>
            <option value="reviewed">Reviewed</option>
            <option value="ips_checked">IPS Checked</option>
          </select>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Did you review your investment portfolio or Investment Policy Statement?
          </p>
        </div>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3 style={{ marginBottom: '15px' }}>Relationship</h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={primaryRelationshipActive}
              onChange={(e) => setPrimaryRelationshipActive(e.target.checked)}
            />
            <span>In a primary relationship (guarantees min 60 score)</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={status.includes('Overlaps') || isSaving}
          style={{
            width: '100%',
            padding: '12px',
            background: (status.includes('Overlaps') || isSaving) ? '#999' : '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: (status.includes('Overlaps') || isSaving) ? 'not-allowed' : 'pointer',
            marginTop: '20px',
          }}
        >
          {existingLogId ? 'Update Weekly Log' : 'Save Weekly Log'}
        </button>

        {status && (
          <p
            style={{
              marginTop: '15px',
              textAlign: 'center',
              color: status.includes('Error') || status.includes('Overlaps') ? '#ef4444' : '#22c55e',
            }}
          >
            {status}
          </p>
        )}
      </form>
    </div>
  )
}
