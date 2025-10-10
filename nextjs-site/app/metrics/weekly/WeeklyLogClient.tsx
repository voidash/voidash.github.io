'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc as firestoreDoc, orderBy } from 'firebase/firestore'
import { WeeklyLog } from '@/lib/metrics-types'
import { parseMarkdownTasks, countCompletedTasks, extractWeeklyTaskData } from '@/lib/task-parser'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getSunday(mondayStr: string): string {
  if (!mondayStr) return ''
  const d = new Date(mondayStr)
  if (isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

export default function WeeklyLogClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add')

  const today = new Date()
  const [weekStart, setWeekStart] = useState(getMonday(today))
  const [weekEnd, setWeekEnd] = useState(getSunday(getMonday(today)))
  const [manualWeekEnd, setManualWeekEnd] = useState(false)

  const [tasksMarkdown, setTasksMarkdown] = useState('')
  const [targetWeight, setTargetWeight] = useState(0)
  const [primaryRelationshipActive, setPrimaryRelationshipActive] = useState(false)
  const [financeConceptApplied, setFinanceConceptApplied] = useState<'none' | 'noted' | 'implemented'>('none')
  const [portfolioReview, setPortfolioReview] = useState<'none' | 'reviewed' | 'ips_checked'>('none')

  const [status, setStatus] = useState('')
  const [existingLogId, setExistingLogId] = useState<string | null>(null)
  const [allLogs, setAllLogs] = useState<Array<WeeklyLog & { id: string }>>([])
  const [isSaving, setIsSaving] = useState(false)

  // Update weekEnd when weekStart changes (only if not manually set)
  useEffect(() => {
    if (!manualWeekEnd) {
      setWeekEnd(getSunday(weekStart))
    }
  }, [weekStart, manualWeekEnd])

  // Check if selected week overlaps with existing weeks
  // Only validate when weekStart changes, not on every weekEnd update
  useEffect(() => {
    if (!user || activeTab !== 'add') return

    async function checkOverlap() {
      try {
        const start = new Date(weekStart)
        const end = new Date(weekEnd)

        // Fetch all weekly logs
        const q = query(collection(db, 'weekly_logs'), orderBy('weekStart', 'asc'))
        const snapshot = await getDocs(q)

        for (const doc of snapshot.docs) {
          const log = doc.data() as WeeklyLog
          const logStart = new Date(log.weekStart)
          const logEnd = new Date(log.weekEnd)

          // Check for overlap (but allow same week for editing)
          if (log.weekStart !== weekStart) {
            const overlaps = (start <= logEnd && end >= logStart)
            if (overlaps) {
              setStatus(`⚠️ Overlaps with week ${log.weekStart} to ${log.weekEnd}`)
              return
            }
          }
        }

        // Check if this exact week exists
        const exactQ = query(collection(db, 'weekly_logs'), where('weekStart', '==', weekStart))
        const exactSnapshot = await getDocs(exactQ)

        if (!exactSnapshot.empty) {
          const existingDoc = exactSnapshot.docs[0]
          const logData = existingDoc.data() as WeeklyLog

          setExistingLogId(existingDoc.id)
          setTasksMarkdown(logData.tasksMarkdown)
          setTargetWeight(logData.targetWeight || 0)
          setPrimaryRelationshipActive(logData.primaryRelationshipActive)
          setFinanceConceptApplied(logData.financeConceptApplied || 'none')
          setPortfolioReview(logData.portfolioReview || 'none')
          // Only set weekEnd if it's valid, otherwise let useEffect calculate it
          if (logData.weekEnd) {
            setManualWeekEnd(true)
            setWeekEnd(logData.weekEnd)
          }
          setStatus('')
        } else {
          setExistingLogId(null)
          setStatus('')
        }
      } catch (error) {
        console.error('Error checking overlap:', error)
      }
    }

    checkOverlap()
  }, [weekStart, user, activeTab])

  // Fetch all logs for view tab
  useEffect(() => {
    if (!user || activeTab !== 'view') return

    async function fetchAllLogs() {
      try {
        const q = query(collection(db, 'weekly_logs'), orderBy('weekStart', 'desc'))
        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WeeklyLog & { id: string }))
        setAllLogs(logs)
      } catch (error) {
        console.error('Error fetching logs:', error)
      }
    }

    fetchAllLogs()
  }, [activeTab, user])

  const taskStats = useMemo(() => {
    if (!tasksMarkdown.trim()) return null
    const tasks = parseMarkdownTasks(tasksMarkdown)
    const counts = countCompletedTasks(tasks)
    const weeklyData = extractWeeklyTaskData(tasksMarkdown)

    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      financeConceptApplied: weeklyData.financeConceptApplied,
      portfolioReview: weeklyData.portfolioReview,
    }
  }, [tasksMarkdown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      setStatus('Error: You must be logged in')
      return
    }

    if (status.includes('Overlaps')) {
      setStatus('Error: Cannot save overlapping week')
      return
    }

    if (isSaving) {
      return // Prevent double submission
    }

    setIsSaving(true)
    setStatus('Saving...')

    try {
      // Re-check if this week already exists to prevent race conditions
      const exactQ = query(collection(db, 'weekly_logs'), where('weekStart', '==', weekStart))
      const exactSnapshot = await getDocs(exactQ)

      const logData: WeeklyLog = {
        weekStart,
        weekEnd,
        tasksMarkdown,
        targetWeight,
        primaryRelationshipActive,
        financeConceptApplied,
        portfolioReview,
        createdAt: new Date().toISOString(),
      }

      let docIdToUpdate = existingLogId

      // If existingLogId is null but a document exists, use that document's ID
      if (!docIdToUpdate && !exactSnapshot.empty) {
        docIdToUpdate = exactSnapshot.docs[0].id
      }

      if (docIdToUpdate) {
        // Update existing log
        const docRef = firestoreDoc(db, 'weekly_logs', docIdToUpdate)
        await updateDoc(docRef, logData as any)
        setExistingLogId(docIdToUpdate)
        setStatus('✓ Updated')
      } else {
        // Create new log
        const newDocRef = await addDoc(collection(db, 'weekly_logs'), logData)
        setExistingLogId(newDocRef.id)
        setStatus('✓ Saved')
      }

      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error saving log:', error)
      setStatus('Error saving log')
    } finally {
      setIsSaving(false)
    }
  }

  function loadLogForEditing(log: WeeklyLog & { id: string }) {
    setWeekStart(log.weekStart)
    // Only set weekEnd if valid, otherwise let it auto-calculate
    if (log.weekEnd) {
      setManualWeekEnd(true)
      setWeekEnd(log.weekEnd)
    } else {
      setManualWeekEnd(false)
    }
    setTasksMarkdown(log.tasksMarkdown)
    setTargetWeight(log.targetWeight || 0)
    setPrimaryRelationshipActive(log.primaryRelationshipActive)
    setFinanceConceptApplied(log.financeConceptApplied || 'none')
    setPortfolioReview(log.portfolioReview || 'none')
    setExistingLogId(log.id)
    setActiveTab('add')
  }

  async function handleDeleteLog(logId: string) {
    if (!window.confirm('Are you sure you want to delete this weekly log? This action cannot be undone.')) {
      return
    }

    try {
      const docRef = firestoreDoc(db, 'weekly_logs', logId)
      await deleteDoc(docRef)

      // Refresh the logs list
      setAllLogs(allLogs.filter(log => log.id !== logId))
    } catch (error) {
      console.error('Error deleting log:', error)
      alert('Error deleting log')
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
      <nav style={{ marginBottom: '20px' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>Weekly Log</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Set weekly goals and parameters
      </p>

      {/* Tabs */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('add')}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: activeTab === 'add' ? '#0066cc' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'add' ? '2px solid #0066cc' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'add' ? '600' : '400',
          }}
        >
          {existingLogId ? 'Edit Log' : 'Add Log'}
        </button>
        <button
          onClick={() => setActiveTab('view')}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: activeTab === 'view' ? '#0066cc' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'view' ? '2px solid #0066cc' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'view' ? '600' : '400',
          }}
        >
          View Logs
        </button>
      </div>

      {activeTab === 'add' ? (
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
      ) : (
        <>
          {/* View Logs Table */}
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
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => loadLogForEditing(log)}
                            style={{
                              padding: '4px 12px',
                              background: '#0066cc',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
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
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {allLogs.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No logs found. Add your first weekly log!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
