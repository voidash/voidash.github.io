'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore'
import { ExpenseCategory, Expense, Income, BudgetTarget } from '@/lib/metrics-types'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

type ExpenseWithId = Expense & { id: string }
type IncomeWithId = Income & { id: string }

export default function FinanceDashboardClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [expenses, setExpenses] = useState<ExpenseWithId[]>([])
  const [incomes, setIncomes] = useState<IncomeWithId[]>([])
  const [budgetTarget, setBudgetTarget] = useState<BudgetTarget | null>(null)

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)

  // New category state
  const [newCategoryName, setNewCategoryName] = useState('')

  // Budget state
  const [weeklyIncome, setWeeklyIncome] = useState(0)
  const [weeklySpendCap, setWeeklySpendCap] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlySpendCap, setMonthlySpendCap] = useState(0)
  const [yearlyIncome, setYearlyIncome] = useState(0)
  const [yearlySpendCap, setYearlySpendCap] = useState(0)
  const [targetSavingsRate, setTargetSavingsRate] = useState(0.4)

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    store: '',
    amount: 0,
    categoryId: '',
    notes: ''
  })

  const [newIncome, setNewIncome] = useState<Partial<Income>>({
    date: new Date().toISOString().split('T')[0],
    source: '',
    amount: 0
  })

  const [status, setStatus] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/metrics/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadAll()
    }
  }, [user])

  async function loadAll() {
    try {
      await Promise.all([
        loadCategories(),
        loadExpenses(),
        loadIncomes(),
        loadBudgetTarget()
      ])
    } catch (error: any) {
      console.error('Error loading data:', error)
      setStatus(`Error: ${error.message || 'Failed to load data'}`)
      setTimeout(() => setStatus(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    const q = query(collection(db, 'expense_categories'), orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseCategory))
    setCategories(cats)
  }

  async function loadExpenses() {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    const exps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ExpenseWithId))
    setExpenses(exps)
  }

  async function loadIncomes() {
    const q = query(collection(db, 'income'), orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    const incs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IncomeWithId))
    setIncomes(incs)
  }

  async function loadBudgetTarget() {
    const snapshot = await getDocs(collection(db, 'budget_targets'))
    if (!snapshot.empty) {
      const target = snapshot.docs[0].data() as BudgetTarget
      setBudgetTarget(target)
      setWeeklyIncome(target.weeklyIncome || 0)
      setWeeklySpendCap(target.weeklySpendCap || 0)
      setMonthlyIncome(target.monthlyIncome || 0)
      setMonthlySpendCap(target.monthlySpendCap || 0)
      setYearlyIncome(target.yearlyIncome || 0)
      setYearlySpendCap(target.yearlySpendCap || 0)
      setTargetSavingsRate(target.targetSavingsRate || 0.4)
    }
  }

  async function addCategory() {
    if (!newCategoryName.trim()) {
      setStatus('Error: Category name required')
      setTimeout(() => setStatus(''), 2000)
      return
    }

    try {
      await addDoc(collection(db, 'expense_categories'), {
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString(),
      })
      setNewCategoryName('')
      await loadCategories()
      setStatus('✓ Category added')
      setTimeout(() => setStatus(''), 2000)
    } catch (error: any) {
      console.error('Error adding category:', error)
      setStatus(`Error: ${error.message || 'Failed to add category'}`)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return

    try {
      await deleteDoc(doc(db, 'expense_categories', id))
      await loadCategories()
      setStatus('✓ Category deleted')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error deleting category:', error)
      setStatus('Error deleting category')
    }
  }

  async function saveBudgetTargets() {
    try {
      const budgetData: BudgetTarget = {
        weeklyIncome,
        weeklySpendCap,
        monthlyIncome,
        monthlySpendCap,
        yearlyIncome,
        yearlySpendCap,
        targetSavingsRate,
        updatedAt: new Date().toISOString(),
      }

      // Delete old targets and create new
      const snapshot = await getDocs(collection(db, 'budget_targets'))
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref)
      }

      await addDoc(collection(db, 'budget_targets'), budgetData)
      await loadBudgetTarget()

      setStatus('✓ Budget targets saved')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error saving budget targets:', error)
      setStatus('Error saving budget targets')
    }
  }

  async function addExpense() {
    if (!newExpense.store || !newExpense.categoryId) {
      setStatus('Error: Store and category required')
      setTimeout(() => setStatus(''), 2000)
      return
    }

    try {
      await addDoc(collection(db, 'expenses'), {
        ...newExpense,
        createdAt: new Date().toISOString()
      })

      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        store: '',
        amount: 0,
        categoryId: '',
        notes: ''
      })

      await loadExpenses()
      setStatus('✓ Expense added')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error adding expense:', error)
      setStatus('Error adding expense')
    }
  }

  async function updateExpense(id: string, data: Partial<Expense>) {
    try {
      await updateDoc(doc(db, 'expenses', id), data)
      await loadExpenses()
      setEditingExpenseId(null)
      setStatus('✓ Expense updated')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error updating expense:', error)
      setStatus('Error updating expense')
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return

    try {
      await deleteDoc(doc(db, 'expenses', id))
      await loadExpenses()
      setStatus('✓ Expense deleted')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error deleting expense:', error)
      setStatus('Error deleting expense')
    }
  }

  async function addIncome() {
    if (!newIncome.source) {
      setStatus('Error: Source required')
      setTimeout(() => setStatus(''), 2000)
      return
    }

    try {
      await addDoc(collection(db, 'income'), {
        ...newIncome,
        createdAt: new Date().toISOString()
      })

      setNewIncome({
        date: new Date().toISOString().split('T')[0],
        source: '',
        amount: 0
      })

      await loadIncomes()
      setStatus('✓ Income added')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error adding income:', error)
      setStatus('Error adding income')
    }
  }

  async function updateIncome(id: string, data: Partial<Income>) {
    try {
      await updateDoc(doc(db, 'income', id), data)
      await loadIncomes()
      setEditingIncomeId(null)
      setStatus('✓ Income updated')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error updating income:', error)
      setStatus('Error updating income')
    }
  }

  async function deleteIncome(id: string) {
    if (!confirm('Delete this income?')) return

    try {
      await deleteDoc(doc(db, 'income', id))
      await loadIncomes()
      setStatus('✓ Income deleted')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error deleting income:', error)
      setStatus('Error deleting income')
    }
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown'
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const netBalance = totalIncome - totalExpenses

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const categoryId = expense.categoryId
    if (!acc[categoryId]) {
      acc[categoryId] = {
        total: 0,
        count: 0,
        categoryName: getCategoryName(categoryId)
      }
    }
    acc[categoryId].total += expense.amount
    acc[categoryId].count += 1
    return acc
  }, {} as Record<string, { total: number; count: number; categoryName: string }>)

  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([categoryId, data]) => ({
      categoryId,
      ...data,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)

  // Show loading state while auth is loading or redirecting
  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  // If not authenticated, don't render (will redirect)
  if (!user) {
    return null
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ marginBottom: '5px' }}>Finance Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Track and manage your finances
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '40px'
        }}>
          <h2 style={{ marginBottom: '20px' }}>Categories & Budget Settings</h2>

          {/* Categories */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Expense Categories</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={addCategory}
                style={{
                  padding: '8px 16px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    background: 'var(--card-bg)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{cat.name}</span>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0 4px',
                      fontSize: '16px'
                    }}
                    title="Delete category"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Targets */}
          <div>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Budget Targets</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '15px'
            }}>
              {/* Weekly */}
              <div>
                <div style={{ fontWeight: '500', marginBottom: '10px' }}>Weekly</div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>
                    Income Target
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weeklyIncome}
                    onChange={(e) => setWeeklyIncome(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>
                    Spend Cap
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weeklySpendCap}
                    onChange={(e) => setWeeklySpendCap(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Monthly */}
              <div>
                <div style={{ fontWeight: '500', marginBottom: '10px' }}>Monthly</div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>
                    Income Target
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>
                    Spend Cap
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlySpendCap}
                    onChange={(e) => setMonthlySpendCap(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Yearly */}
              <div>
                <div style={{ fontWeight: '500', marginBottom: '10px' }}>Yearly</div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>
                    Income Target
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={yearlyIncome}
                    onChange={(e) => setYearlyIncome(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>
                    Spend Cap
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={yearlySpendCap}
                    onChange={(e) => setYearlySpendCap(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: '500' }}>
                Target Savings Rate (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={targetSavingsRate}
                onChange={(e) => setTargetSavingsRate(parseFloat(e.target.value) || 0)}
                style={{
                  width: '200px',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                e.g., 0.4 = 40% savings
              </span>
            </div>

            <button
              onClick={saveBudgetTargets}
              style={{
                padding: '10px 20px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Save Budget Settings
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Total Income
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            Rs. {totalIncome.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Total Expenses
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            Rs. {totalExpenses.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Net Balance
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: netBalance >= 0 ? '#22c55e' : '#ef4444'
          }}>
            Rs. {netBalance.toFixed(2)}
          </div>
        </div>

        {budgetTarget && budgetTarget.weeklySpendCap > 0 && (
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Weekly Budget
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {((totalExpenses / budgetTarget.weeklySpendCap) * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
              Cap: Rs. {budgetTarget.weeklySpendCap}
            </div>
          </div>
        )}
      </div>

      {/* Budget Charts */}
      {budgetTarget && budgetTarget.weeklySpendCap > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Budget Visualization</h2>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span>Spending vs Cap</span>
                <span>Rs. {totalExpenses.toFixed(2)} / Rs. {budgetTarget.weeklySpendCap}</span>
              </div>
              <div style={{
                width: '100%',
                height: '30px',
                background: 'var(--card-bg)',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  width: `${Math.min((totalExpenses / budgetTarget.weeklySpendCap) * 100, 100)}%`,
                  height: '100%',
                  background: totalExpenses > budgetTarget.weeklySpendCap ? '#ef4444' : '#22c55e',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {budgetTarget.targetSavingsRate > 0 && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>Savings Rate Target</span>
                  <span>{(budgetTarget.targetSavingsRate * 100).toFixed(0)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '30px',
                  background: 'var(--card-bg)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: `${totalIncome > 0 ? Math.min(((totalIncome - totalExpenses) / totalIncome) * 100, 100) : 0}%`,
                    height: '100%',
                    background: '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  Current: {totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expense Breakdown by Category */}
      {categoryBreakdown.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Expenses by Category</h2>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {categoryBreakdown.map((item) => (
                <div key={item.categoryId}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    <span style={{ fontWeight: '500' }}>{item.categoryName}</span>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {item.count} {item.count === 1 ? 'item' : 'items'}
                      </span>
                      <span>Rs. {item.total.toFixed(2)}</span>
                      <span style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        minWidth: '45px',
                        textAlign: 'right'
                      }}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '24px',
                    background: 'var(--card-bg)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      width: `${item.percentage}%`,
                      height: '100%',
                      background: `hsl(${(item.categoryId.charCodeAt(0) * 137.5) % 360}, 65%, 55%)`,
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '8px',
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: '500'
                    }}>
                      {item.percentage > 10 ? `${item.percentage.toFixed(1)}%` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Expenses</h2>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                background: 'var(--card-bg)',
                borderBottom: '2px solid var(--border-color)'
              }}>
                <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Store</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
                <th style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} style={{
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  {editingExpenseId === expense.id ? (
                    <>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="date"
                          defaultValue={expense.date}
                          onBlur={(e) => updateExpense(expense.id, { date: e.target.value })}
                          style={{
                            width: '140px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="text"
                          defaultValue={expense.store}
                          onBlur={(e) => updateExpense(expense.id, { store: e.target.value })}
                          style={{
                            width: '100%',
                            minWidth: '100px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select
                          defaultValue={expense.categoryId}
                          onChange={(e) => updateExpense(expense.id, { categoryId: e.target.value })}
                          style={{
                            width: '100%',
                            minWidth: '120px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={expense.amount}
                          onBlur={(e) => updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                          style={{
                            width: '100px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="text"
                          defaultValue={expense.notes || ''}
                          onBlur={(e) => updateExpense(expense.id, { notes: e.target.value })}
                          style={{
                            width: '100%',
                            minWidth: '100px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => setEditingExpenseId(null)}
                          style={{
                            padding: '4px 8px',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✓
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{expense.date}</td>
                      <td style={{ padding: '12px' }}>{expense.store}</td>
                      <td style={{ padding: '12px' }}>{getCategoryName(expense.categoryId)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        Rs. {expense.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {expense.notes || '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setEditingExpenseId(expense.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginRight: '5px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Del
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {/* Add New Row */}
              <tr style={{
                borderTop: '2px solid var(--border-color)',
                background: 'var(--card-bg)'
              }}>
                <td style={{ padding: '12px' }}>
                  <input
                    type="date"
                    value={newExpense.date || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    style={{
                      width: '140px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <input
                    type="text"
                    placeholder="Store"
                    value={newExpense.store || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, store: e.target.value })}
                    style={{
                      width: '100%',
                      minWidth: '100px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <select
                    value={newExpense.categoryId || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      minWidth: '120px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Select</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '12px' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newExpense.amount || 0}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      textAlign: 'right'
                    }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={newExpense.notes || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                    style={{
                      width: '100%',
                      minWidth: '100px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={addExpense}
                    style={{
                      padding: '4px 12px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                    title="Add expense"
                  >
                    +
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Table */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Income</h2>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                background: 'var(--card-bg)',
                borderBottom: '2px solid var(--border-color)'
              }}>
                <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                <th style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id} style={{
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  {editingIncomeId === income.id ? (
                    <>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="date"
                          defaultValue={income.date}
                          onBlur={(e) => updateIncome(income.id, { date: e.target.value })}
                          style={{
                            width: '140px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="text"
                          defaultValue={income.source}
                          onBlur={(e) => updateIncome(income.id, { source: e.target.value })}
                          style={{
                            width: '100%',
                            minWidth: '150px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={income.amount}
                          onBlur={(e) => updateIncome(income.id, { amount: parseFloat(e.target.value) || 0 })}
                          style={{
                            width: '100px',
                            padding: '4px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => setEditingIncomeId(null)}
                          style={{
                            padding: '4px 8px',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✓
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{income.date}</td>
                      <td style={{ padding: '12px' }}>{income.source}</td>
                      <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        Rs. {income.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setEditingIncomeId(income.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginRight: '5px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteIncome(income.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Del
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {/* Add New Row */}
              <tr style={{
                borderTop: '2px solid var(--border-color)',
                background: 'var(--card-bg)'
              }}>
                <td style={{ padding: '12px' }}>
                  <input
                    type="date"
                    value={newIncome.date || ''}
                    onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                    style={{
                      width: '140px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <input
                    type="text"
                    placeholder="Source"
                    value={newIncome.source || ''}
                    onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                    style={{
                      width: '100%',
                      minWidth: '150px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newIncome.amount || 0}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100px',
                      padding: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      textAlign: 'right'
                    }}
                  />
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={addIncome}
                    style={{
                      padding: '4px 12px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                    title="Add income"
                  >
                    +
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {status && (
        <p
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            background: status.includes('Error') ? '#ef4444' : '#22c55e',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '0 4px 12px var(--shadow)',
            zIndex: 1000
          }}
        >
          {status}
        </p>
      )}
    </div>
  )
}
