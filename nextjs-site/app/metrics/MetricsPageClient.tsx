'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'
import { DailyLog, WeeklyLog, TodoSnapshot, Expense, Income, BudgetTarget } from '@/lib/metrics-types'
import { TodoItem } from '@/lib/task-parser'
import { calculateMetrics, CalculatedScores } from '@/lib/metrics-calculator'
import { aggregateMetrics } from '@/lib/metrics-aggregator'
import { useAuth } from '@/lib/auth-context'
import MetricsClient from './MetricsClient'
import sampleData from '@/data/sample-metrics.json'
import { savePublicMetrics } from '@/lib/save-public-metrics'

function getLatestMonday(): string {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  today.setDate(diff)
  return today.toISOString().split('T')[0]
}

type WeekScores = {
  weekStart: string
  weekEnd: string
  scores: CalculatedScores
}

export default function MetricsPageClient() {
  const { user, loading: authLoading, logOut } = useAuth()
  const router = useRouter()
  const [currentScores, setCurrentScores] = useState<CalculatedScores | null>(null)
  const [allWeekScores, setAllWeekScores] = useState<WeekScores[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')

  useEffect(() => {
    async function fetchMetrics() {
      // If not logged in, fetch from static JSON file
      if (!user && !authLoading) {
        try {
          const response = await fetch('/public-metrics.json')
          if (!response.ok) {
            throw new Error('Failed to fetch public metrics')
          }
          const publicData = await response.json()

          if (publicData.currentWeek && publicData.allWeeks) {
            setCurrentScores(publicData.currentWeek.scores)
            setAllWeekScores(publicData.allWeeks)
            setUsingFallback(false)
          } else {
            // Fallback to sample data
            setCurrentScores(calculateMetrics(sampleData as any))
            setUsingFallback(true)
          }
          setLoading(false)
        } catch (error) {
          console.error('Error fetching public metrics:', error)
          setCurrentScores(calculateMetrics(sampleData as any))
          setUsingFallback(true)
          setLoading(false)
        }
        return
      }

      // If not logged in yet, wait
      if (!user) {
        return
      }

      // User is logged in - fetch from Firestore and save to public_metrics
      try {
        // Fetch ALL weekly logs
        const weeklyQuery = query(
          collection(db, 'weekly_logs'),
          orderBy('weekStart', 'desc')
        )
        const weeklySnapshot = await getDocs(weeklyQuery)

        if (weeklySnapshot.empty) {
          console.warn('No weekly logs found, using sample data')
          setCurrentScores(calculateMetrics(sampleData as any))
          setUsingFallback(true)
          setLoading(false)
          return
        }

        // Fetch ALL expenses, income, and todos once (not per week)
        const expensesSnapshot = await getDocs(collection(db, 'expenses'))
        const allExpenses: Expense[] = expensesSnapshot.docs.map((doc) => doc.data() as Expense)

        const incomesSnapshot = await getDocs(collection(db, 'income'))
        const allIncomes: Income[] = incomesSnapshot.docs.map((doc) => doc.data() as Income)

        const todosSnapshot = await getDocs(collection(db, 'todos'))
        const allTodos: TodoItem[] = todosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as TodoItem))

        // Fetch budget target (only one should exist)
        const budgetSnapshot = await getDocs(collection(db, 'budget_targets'))
        const budgetTarget = budgetSnapshot.empty ? null : (budgetSnapshot.docs[0].data() as BudgetTarget)

        const allWeeks: WeekScores[] = []

        // Process each weekly log
        for (const weekDoc of weeklySnapshot.docs) {
          const weeklyLog = weekDoc.data() as WeeklyLog
          const weekStart = weeklyLog.weekStart
          const weekEnd = weeklyLog.weekEnd

          // Fetch daily logs for this week
          const dailyQuery = query(
            collection(db, 'daily_logs'),
            where('date', '>=', weekStart),
            where('date', '<=', weekEnd),
            orderBy('date', 'asc')
          )
          const dailySnapshot = await getDocs(dailyQuery)
          const dailyLogs: DailyLog[] = dailySnapshot.docs.map((doc) => doc.data() as DailyLog)

          // Aggregate and calculate (pass todos instead of snapshots)
          const metricsData = aggregateMetrics(
            dailyLogs,
            weeklyLog,
            allTodos,
            allExpenses,
            allIncomes,
            budgetTarget
          )
          const calculatedScores = calculateMetrics(metricsData)

          allWeeks.push({
            weekStart,
            weekEnd,
            scores: calculatedScores
          })
        }

        // Set current week (first one, which is most recent due to desc order)
        setCurrentScores(allWeeks[0].scores)
        setAllWeekScores(allWeeks)
        setUsingFallback(false)
        setLoading(false)

        // Save to public_metrics for unauthenticated access
        if (allWeeks.length > 0) {
          try {
            await savePublicMetrics({
              currentWeek: allWeeks[0],
              allWeeks: allWeeks,
              updatedAt: new Date().toISOString(),
            })
          } catch (error) {
            console.error('Failed to save public metrics:', error)
            // Don't fail the whole operation if public save fails
          }
        }
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Failed to load metrics data')
        // Fallback to sample data
        setCurrentScores(calculateMetrics(sampleData as any))
        setUsingFallback(true)
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [user, authLoading])

  async function handleLogout() {
    await logOut()
    router.push('/metrics/login')
  }

  if (authLoading || loading) {
    return (
      <main className="metrics-container">
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
      </main>
    )
  }

  if (error && !usingFallback) {
    return (
      <main className="metrics-container">
        <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>
      </main>
    )
  }

  return (
    <main className="metrics-container">
      <nav style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: '#0066cc' }}>
          ← Back
        </Link>
        <span style={{ color: 'var(--text-secondary)' }}>|</span>
        <Link href="/metrics/daily" style={{ color: '#0066cc' }}>
          Daily Log
        </Link>
        <Link href="/metrics/weekly" style={{ color: '#0066cc' }}>
          Weekly Log
        </Link>
        <Link href="/metrics/todo" style={{ color: '#0066cc' }}>
          Todo Tracking
        </Link>
        <Link href="/metrics/finance" style={{ color: '#0066cc' }}>
          Finance
        </Link>
        {user && (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '4px 12px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Logout
            </button>
          </>
        )}
        {!user && (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <Link href="/metrics/login" style={{ color: '#0066cc' }}>
              Login
            </Link>
          </>
        )}
      </nav>

      <div className="metrics-header">
        <h1 className="metrics-title">Life Metrics</h1>
        <p className="metrics-subtitle">
          Weekly tracking across 6 dimensions • Updates every Monday
          {usingFallback && (
            <span style={{ color: '#eab308', marginLeft: '10px' }}>
              (Using sample data - no logs found)
            </span>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('current')}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: activeTab === 'current' ? '#0066cc' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'current' ? '2px solid #0066cc' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'current' ? '600' : '400',
          }}
        >
          Current Week
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: activeTab === 'history' ? '#0066cc' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid #0066cc' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'history' ? '600' : '400',
          }}
        >
          All Weeks History
        </button>
      </div>

      {activeTab === 'current' && currentScores && (
        <MetricsClient
          scores={currentScores}
          weekStart={allWeekScores[0]?.weekStart}
          weekEnd={allWeekScores[0]?.weekEnd}
        />
      )}

      {activeTab === 'history' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Week</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Management</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Learning</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Producer</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Finance</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Fitness</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Relationship</th>
              </tr>
            </thead>
            <tbody>
              {allWeekScores.map((week) => (
                <tr key={week.weekStart} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>
                    {week.weekStart} to {week.weekEnd}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {week.scores.management.score.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {week.scores.learning.score.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {week.scores.producer.score.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {week.scores.finance.score.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {week.scores.fitness.score.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {week.scores.relationship.score.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allWeekScores.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No weekly logs found
            </p>
          )}
        </div>
      )}
    </main>
  )
}
