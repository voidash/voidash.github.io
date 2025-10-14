'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc as firestoreDoc, orderBy, getDoc, deleteDoc } from 'firebase/firestore'
import { DailyLog } from '@/lib/metrics-types'
import { parseMarkdownTasks, countCompletedTasks, extractTodos, TodoItem } from '@/lib/task-parser'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function DailyLogClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [logged, setLogged] = useState(false)
  const [tasksMarkdown, setTasksMarkdown] = useState('')
  const [gymSession, setGymSession] = useState(false)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [caloriesTracked, setCaloriesTracked] = useState(false)
  const [status, setStatus] = useState('')
  const [existingLogId, setExistingLogId] = useState<string | null>(null)
  const [allLogs, setAllLogs] = useState<Array<DailyLog & { id: string }>>([])
  const [previousTodos, setPreviousTodos] = useState<string[]>([]) // Store previous todo IDs

  // Fetch existing log when date changes
  useEffect(() => {
    if (!user) return

    async function loadLogForDate() {
      try {
        const q = query(collection(db, 'daily_logs'), where('date', '==', date))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const logData = doc.data() as DailyLog

          setExistingLogId(doc.id)
          setLogged(logData.logged)
          setTasksMarkdown(logData.tasksMarkdown)
          setGymSession(logData.gymSession)
          setWeight(logData.weight)
          setCaloriesTracked(logData.caloriesTracked)

          // Store previous todos for this log
          const todos = extractTodos(logData.tasksMarkdown, date)
          const todoIds = await findExistingTodoIds(todos)
          setPreviousTodos(todoIds)
        } else {
          // Reset form for new date
          setExistingLogId(null)
          setLogged(false)
          setTasksMarkdown('')
          setGymSession(false)
          setWeight(undefined)
          setCaloriesTracked(false)
          setPreviousTodos([])
        }
      } catch (error) {
        console.error('Error loading log:', error)
      }
    }

    loadLogForDate()
  }, [date, user])

  // Fetch all logs for view tab
  useEffect(() => {
    if (!user || activeTab !== 'view') return

    async function fetchAllLogs() {
      try {
        const q = query(collection(db, 'daily_logs'), orderBy('date', 'desc'))
        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DailyLog & { id: string }))
        setAllLogs(logs)
      } catch (error) {
        console.error('Error fetching logs:', error)
      }
    }

    fetchAllLogs()
  }, [activeTab, user])

  async function findExistingTodoIds(todos: TodoItem[]): Promise<string[]> {
    const ids: string[] = []
    for (const todo of todos) {
      const q = query(
        collection(db, 'todos'),
        where('text', '==', todo.text),
        where('label', '==', todo.label),
        where('sourceDate', '==', date)
      )
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        ids.push(snapshot.docs[0].id)
      }
    }
    return ids
  }

  async function syncTodos() {
    const currentTodos = extractTodos(tasksMarkdown, date)

    // Build a map of previous todos
    const prevTodoMap = new Map<string, { docId: string, todo: TodoItem }>()
    for (const prevId of previousTodos) {
      try {
        const docRef = firestoreDoc(db, 'todos', prevId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const prevTodo = docSnap.data() as TodoItem
          const key = `${prevTodo.text}|${prevTodo.label}`
          prevTodoMap.set(key, { docId: prevId, todo: prevTodo })
        }
      } catch (e) {
        console.error('Error fetching previous todo:', e)
      }
    }

    // Find todos to add or update
    const currentTodoMap = new Map<string, TodoItem>()
    for (const todo of currentTodos) {
      const key = `${todo.text}|${todo.label}`
      currentTodoMap.set(key, todo)
    }

    // Add new todos or update existing ones
    for (const [key, todo] of currentTodoMap.entries()) {
      const existing = prevTodoMap.get(key)

      if (!existing) {
        // New todo - add to Firebase
        try {
          const todoData: TodoItem = {
            text: todo.text,
            label: todo.label,
            sourceDate: date,
            completed: todo.completed,
            createdAt: new Date().toISOString(),
          }
          if (todo.completed) {
            todoData.completedDate = new Date().toISOString().split('T')[0]
          }
          await addDoc(collection(db, 'todos'), todoData)
        } catch (e) {
          console.error('Error adding todo:', e)
        }
      } else {
        // Existing todo - check if completion state changed
        if (existing.todo.completed !== todo.completed) {
          try {
            const docRef = firestoreDoc(db, 'todos', existing.docId)
            const updateData: any = { completed: todo.completed }
            if (todo.completed) {
              updateData.completedDate = new Date().toISOString().split('T')[0]
            } else {
              updateData.completedDate = null
            }
            await updateDoc(docRef, updateData)
          } catch (e) {
            console.error('Error updating todo:', e)
          }
        }
      }
    }

    // Find todos to remove (previous ones not in current)
    for (const [key, { docId }] of prevTodoMap.entries()) {
      if (!currentTodoMap.has(key)) {
        try {
          // Delete the todo from Firebase
          const docRef = firestoreDoc(db, 'todos', docId)
          await deleteDoc(docRef)
        } catch (e) {
          console.error('Error deleting todo:', e)
        }
      }
    }

    // Update previous todos list
    const newTodoIds = await findExistingTodoIds(currentTodos)
    setPreviousTodos(newTodoIds)
  }

  const taskStats = useMemo(() => {
    if (!tasksMarkdown.trim()) return null
    const tasks = parseMarkdownTasks(tasksMarkdown)
    const counts = countCompletedTasks(tasks)
    const todos = extractTodos(tasksMarkdown, date)

    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      learningArtifacts: counts.learningArtifacts,
      revisionNotesCreated: counts.revisionNotesCreated,
      revisionPointsReviewed: counts.revisionPointsReviewed,
      publicOutputs: counts.publicOutputs,
      newInteractions: counts.newInteractions,
      familyCalls: counts.familyCalls,
      conflictsResolved: counts.conflictsResolved,
      unresolvedConflicts: counts.unresolvedConflicts,
      todosAdded: todos.length,
    }
  }, [tasksMarkdown, date])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      setStatus('Error: You must be logged in')
      return
    }

    setStatus('Saving...')

    try {
      const logData: any = {
        date,
        logged,
        tasksMarkdown,
        gymSession,
        caloriesTracked,
        createdAt: new Date().toISOString(),
      }

      // Only add weight if it's defined
      if (weight !== undefined && weight !== null) {
        logData.weight = weight
      }

      if (existingLogId) {
        // Update existing log
        const docRef = firestoreDoc(db, 'daily_logs', existingLogId)
        await updateDoc(docRef, logData)
        setStatus('✓ Updated')
      } else {
        // Create new log
        await addDoc(collection(db, 'daily_logs'), logData)
        setStatus('✓ Saved')
      }

      // Sync todos
      await syncTodos()

      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error saving log:', error)
      setStatus('Error saving log')
    }
  }

  function loadLogForEditing(log: DailyLog & { id: string }) {
    setDate(log.date)
    setLogged(log.logged)
    setTasksMarkdown(log.tasksMarkdown)
    setGymSession(log.gymSession)
    setWeight(log.weight)
    setCaloriesTracked(log.caloriesTracked)
    setExistingLogId(log.id)
    setActiveTab('add')
  }

  async function handleDeleteLog(logId: string) {
    if (!confirm('Are you sure you want to delete this daily log?')) return

    try {
      await deleteDoc(firestoreDoc(db, 'daily_logs', logId))
      setStatus('✓ Log deleted')

      // Refresh the logs list
      const q = query(collection(db, 'daily_logs'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DailyLog & { id: string }))
      setAllLogs(logs)

      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error deleting log:', error)
      setStatus('Error deleting log')
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
      <nav style={{ marginBottom: '20px' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>Daily Log</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Track your day with markdown checkboxes and tags
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
        <>
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
        </>
      ) : (
        <>
          {/* View Logs Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Logged</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Tasks</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Learn</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Review</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Produce</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Gym</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Weight</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allLogs.map((log) => {
                  const tasks = parseMarkdownTasks(log.tasksMarkdown)
                  const counts = countCompletedTasks(tasks)
                  const completed = tasks.filter(t => t.completed).length

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>{log.date}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {log.logged ? '✓' : '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {completed}/{tasks.length}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{counts.learningArtifacts}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{counts.revisionPointsReviewed}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{counts.publicOutputs}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {log.gymSession ? '✓' : '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {log.weight ? `${log.weight}kg` : '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
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
                          Del
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {allLogs.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No logs found. Add your first log!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
