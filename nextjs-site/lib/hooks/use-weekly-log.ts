'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc as firestoreDoc, orderBy } from 'firebase/firestore'
import { WeeklyLog } from '@/lib/metrics-types'
import { parseMarkdownTasks, countCompletedTasks, extractWeeklyTaskData } from '@/lib/task-parser'

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

export function useWeeklyLog(userId: string | null, initialWeekStart?: string) {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(initialWeekStart || getMonday(today))
  const [weekEnd, setWeekEnd] = useState(getSunday(initialWeekStart || getMonday(today)))
  const [manualWeekEnd, setManualWeekEnd] = useState(false)

  const [tasksMarkdown, setTasksMarkdown] = useState('')
  const [targetWeight, setTargetWeight] = useState(0)
  const [primaryRelationshipActive, setPrimaryRelationshipActive] = useState(false)
  const [financeConceptApplied, setFinanceConceptApplied] = useState<'none' | 'noted' | 'implemented'>('none')
  const [portfolioReview, setPortfolioReview] = useState<'none' | 'reviewed' | 'ips_checked'>('none')

  const [status, setStatus] = useState('')
  const [existingLogId, setExistingLogId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Update weekEnd when weekStart changes (only if not manually set)
  useEffect(() => {
    if (!manualWeekEnd) {
      setWeekEnd(getSunday(weekStart))
    }
  }, [weekStart, manualWeekEnd])

  // Check if selected week overlaps with existing weeks
  useEffect(() => {
    if (!userId) return

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
  }, [weekStart, userId])

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

  async function saveLog() {
    if (!userId) {
      setStatus('Error: You must be logged in')
      return false
    }

    if (status.includes('Overlaps')) {
      setStatus('Error: Cannot save overlapping week')
      return false
    }

    if (isSaving) {
      return false // Prevent double submission
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
      return true
    } catch (error) {
      console.error('Error saving log:', error)
      setStatus('Error saving log')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  function loadLog(log: WeeklyLog & { id: string }) {
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
  }

  return {
    // State
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
    manualWeekEnd,

    // Setters
    setWeekStart,
    setWeekEnd,
    setTasksMarkdown,
    setTargetWeight,
    setPrimaryRelationshipActive,
    setFinanceConceptApplied,
    setPortfolioReview,
    setManualWeekEnd,

    // Actions
    saveLog,
    loadLog,
  }
}

export function useWeeklyLogs(userId: string | null) {
  const [allLogs, setAllLogs] = useState<Array<WeeklyLog & { id: string }>>([])
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
        const q = query(collection(db, 'weekly_logs'), orderBy('weekStart', 'desc'))
        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WeeklyLog & { id: string }))
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
    if (!window.confirm('Are you sure you want to delete this weekly log? This action cannot be undone.')) {
      return false
    }

    try {
      const docRef = firestoreDoc(db, 'weekly_logs', logId)
      await deleteDoc(docRef)

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
      const q = query(collection(db, 'weekly_logs'), orderBy('weekStart', 'desc'))
      const snapshot = await getDocs(q)
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WeeklyLog & { id: string }))
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
