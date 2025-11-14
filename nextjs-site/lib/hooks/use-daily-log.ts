'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc as firestoreDoc, orderBy, getDoc, deleteDoc } from 'firebase/firestore'
import { DailyLog, WeeklyLog } from '@/lib/metrics-types'
import { parseMarkdownTasks, countCompletedTasks, extractTodos, TodoItem, extractLearningItems } from '@/lib/task-parser'
import { createNewLearningItem } from '@/lib/spaced-repetition'

// Helper to get week start (Monday) for a given date
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  const monday = new Date(date.setDate(diff))
  return monday.toISOString().split('T')[0]
}

// Helper to get previous day
function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

export function useDailyLog(userId: string | null, initialDate?: string) {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [logged, setLogged] = useState(false)
  const [tasksMarkdown, setTasksMarkdown] = useState('')
  const [gymSession, setGymSession] = useState(false)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [caloriesTracked, setCaloriesTracked] = useState(false)
  const [status, setStatus] = useState('')
  const [existingLogId, setExistingLogId] = useState<string | null>(null)
  const [previousTodos, setPreviousTodos] = useState<string[]>([])

  // Context data
  const [weeklyLog, setWeeklyLog] = useState<WeeklyLog | null>(null)
  const [previousDayLog, setPreviousDayLog] = useState<DailyLog | null>(null)

  // Fetch existing log when date changes
  useEffect(() => {
    if (!userId) return

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
  }, [date, userId])

  // Fetch context data (weekly log and previous day)
  useEffect(() => {
    if (!userId) return

    async function fetchContext() {
      try {
        // Fetch weekly log
        const weekStart = getWeekStart(date)
        const weekQuery = query(collection(db, 'weekly_logs'), where('weekStart', '==', weekStart))
        const weekSnapshot = await getDocs(weekQuery)
        if (!weekSnapshot.empty) {
          setWeeklyLog(weekSnapshot.docs[0].data() as WeeklyLog)
        } else {
          setWeeklyLog(null)
        }

        // Fetch previous day's log
        const previousDate = getPreviousDay(date)
        const prevQuery = query(collection(db, 'daily_logs'), where('date', '==', previousDate))
        const prevSnapshot = await getDocs(prevQuery)
        if (!prevSnapshot.empty) {
          setPreviousDayLog(prevSnapshot.docs[0].data() as DailyLog)
        } else {
          setPreviousDayLog(null)
        }
      } catch (error) {
        console.error('Error fetching context:', error)
      }
    }

    fetchContext()
  }, [date, userId])

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

  async function syncLearningItems() {
    if (!userId) return

    const learningItems = extractLearningItems(tasksMarkdown, date)

    console.log('📚 Extracted learning items:', learningItems.length, learningItems)

    if (learningItems.length === 0) {
      console.log('ℹ️ No learning items found (no #learn or #review tags in completed tasks)')
      return
    }

    for (const item of learningItems) {
      try {
        console.log('🔍 Checking if learning item exists:', item.text)

        // Check if this exact item already exists for this user
        const q = query(
          collection(db, 'learning_items'),
          where('userId', '==', userId),
          where('text', '==', item.text)
        )
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          // Item exists - update the relatedDates array
          console.log('✏️ Updating existing learning item')
          const existingDoc = snapshot.docs[0]
          const existingItem = existingDoc.data()
          const relatedDates = existingItem.relatedDates || []

          if (!relatedDates.includes(date)) {
            await updateDoc(firestoreDoc(db, 'learning_items', existingDoc.id), {
              relatedDates: [...relatedDates, date]
            })
            console.log('✓ Updated relatedDates')
          } else {
            console.log('ℹ️ Date already in relatedDates')
          }
        } else {
          // Create new learning item
          console.log('➕ Creating new learning item for date:', date)
          const newItem = createNewLearningItem(userId, item.text, date, item.sourceType)
          console.log('   Source date:', date, '→ Next review:', newItem.nextReviewDate)
          const docRef = await addDoc(collection(db, 'learning_items'), newItem)
          console.log('✓ Created learning item with ID:', docRef.id)
        }
      } catch (e) {
        console.error('❌ Error syncing learning item:', e)
        console.error('Item that failed:', item)
      }
    }
  }

  async function saveLog() {
    if (!userId) {
      setStatus('Error: You must be logged in')
      return false
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

      // Sync learning items for spaced repetition
      await syncLearningItems()

      setTimeout(() => setStatus(''), 2000)
      return true
    } catch (error) {
      console.error('Error saving log:', error)
      setStatus('Error saving log')
      return false
    }
  }

  function loadLog(log: DailyLog & { id: string }) {
    setDate(log.date)
    setLogged(log.logged)
    setTasksMarkdown(log.tasksMarkdown)
    setGymSession(log.gymSession)
    setWeight(log.weight)
    setCaloriesTracked(log.caloriesTracked)
    setExistingLogId(log.id)
  }

  return {
    // State
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

    // Setters
    setDate,
    setLogged,
    setTasksMarkdown,
    setGymSession,
    setWeight,
    setCaloriesTracked,

    // Actions
    saveLog,
    loadLog,
  }
}

export function useDailyLogs(userId: string | null) {
  const [allLogs, setAllLogs] = useState<Array<DailyLog & { id: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setAllLogs([])
      setLoading(false)
      return
    }

    async function fetchAllLogs() {
      try {
        setLoading(true)
        const q = query(collection(db, 'daily_logs'), orderBy('date', 'desc'))
        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DailyLog & { id: string }))
        setAllLogs(logs)
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllLogs()
  }, [userId])

  async function deleteLog(logId: string) {
    if (!confirm('Are you sure you want to delete this daily log?')) return false

    try {
      await deleteDoc(firestoreDoc(db, 'daily_logs', logId))

      // Update local state
      setAllLogs(allLogs.filter(log => log.id !== logId))
      return true
    } catch (error) {
      console.error('Error deleting log:', error)
      return false
    }
  }

  async function refreshLogs() {
    if (!userId) return

    try {
      const q = query(collection(db, 'daily_logs'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DailyLog & { id: string }))
      setAllLogs(logs)
    } catch (error) {
      console.error('Error refreshing logs:', error)
    }
  }

  return {
    allLogs,
    loading,
    deleteLog,
    refreshLogs,
  }
}
