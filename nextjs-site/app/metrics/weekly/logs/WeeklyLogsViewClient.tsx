'use client'

import { useRouter } from 'next/navigation'
import { useWeeklyLogs } from '@/lib/hooks/use-weekly-log'
import { parseMarkdownTasks, extractWeeklyTaskData } from '@/lib/task-parser'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function WeeklyLogsViewClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { allLogs, loading, deleteLog } = useWeeklyLogs(user?.uid || null)

  async function handleDeleteLog(logId: string) {
    const success = await deleteLog(logId)
    if (success) {
      // Log removed from state automatically
    }
  }

  function handleEditLog(weekStart: string) {
    router.push(`/metrics/weekly/add?weekStart=${weekStart}`)
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
          You must be logged in to view weekly logs.
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
          href="/metrics/weekly/add"
          style={{
            color: '#0066cc',
            padding: '6px 12px',
            border: '1px solid #0066cc',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Add New Log
        </Link>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>Weekly Logs</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        View and manage all your weekly log entries
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Week Range</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Tasks</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Finance</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Portfolio</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Target Weight</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Primary Relationship</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allLogs.map((log) => {
              const tasks = parseMarkdownTasks(log.tasksMarkdown)
              const completed = tasks.filter(t => t.completed).length
              const weeklyData = extractWeeklyTaskData(log.tasksMarkdown)

              // Use explicit fields when available, fallback to markdown parsing
              const financeStatus = log.financeConceptApplied || weeklyData.financeConceptApplied
              const portfolioStatus = log.portfolioReview || weeklyData.portfolioReview

              return (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>
                    {log.weekStart} to {log.weekEnd}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {completed}/{tasks.length}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {financeStatus === 'implemented' ? '✓' : financeStatus === 'noted' ? '○' : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {portfolioStatus === 'ips_checked' ? 'IPS' :
                     portfolioStatus === 'reviewed' ? '✓' : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {log.targetWeight > 0 ? `${log.targetWeight}kg` : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {log.primaryRelationshipActive ? '✓' : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEditLog(log.weekStart)}
                      style={{
                        padding: '4px 12px',
                        background: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '5px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      style={{
                        padding: '4px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {allLogs.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No logs found. <Link href="/metrics/weekly/add" style={{ color: '#0066cc' }}>Add your first weekly log!</Link>
          </p>
        )}
      </div>
    </div>
  )
}
