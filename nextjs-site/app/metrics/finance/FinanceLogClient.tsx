'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { ExpenseCategory, Expense, Income, BudgetTarget } from '@/lib/metrics-types'
import Link from 'next/link'

export default function FinanceLogClient() {
  const [activeTab, setActiveTab] = useState<'categories' | 'expenses' | 'income' | 'budget'>('categories')

  // Categories
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')

  // Expenses
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [expenseStore, setExpenseStore] = useState('')
  const [expenseAmount, setExpenseAmount] = useState(0)
  const [expenseCategoryId, setExpenseCategoryId] = useState('')
  const [expenseNotes, setExpenseNotes] = useState('')

  // Income
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0])
  const [incomeSource, setIncomeSource] = useState('')
  const [incomeAmount, setIncomeAmount] = useState(0)

  // Budget
  const [weeklyIncome, setWeeklyIncome] = useState(0)
  const [weeklySpendCap, setWeeklySpendCap] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlySpendCap, setMonthlySpendCap] = useState(0)
  const [yearlyIncome, setYearlyIncome] = useState(0)
  const [yearlySpendCap, setYearlySpendCap] = useState(0)
  const [targetSavingsRate, setTargetSavingsRate] = useState(0.4)

  const [status, setStatus] = useState('')

  useEffect(() => {
    loadCategories()
    loadBudgetTargets()
  }, [])

  async function loadCategories() {
    const q = query(collection(db, 'expense_categories'), orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseCategory))
    setCategories(cats)
  }

  async function loadBudgetTargets() {
    const snapshot = await getDocs(collection(db, 'budget_targets'))
    if (!snapshot.empty) {
      const target = snapshot.docs[0].data() as BudgetTarget
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
    if (!newCategoryName.trim()) return

    try {
      await addDoc(collection(db, 'expense_categories'), {
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString(),
      })
      setNewCategoryName('')
      loadCategories()
      setStatus('✓ Category added')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error adding category:', error)
      setStatus('Error adding category')
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return

    try {
      await deleteDoc(doc(db, 'expense_categories', id))
      loadCategories()
      setStatus('✓ Category deleted')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error deleting category:', error)
      setStatus('Error deleting category')
    }
  }

  async function addExpense() {
    if (!expenseStore.trim() || !expenseCategoryId) {
      setStatus('Error: Store and category required')
      return
    }

    try {
      const expenseData: any = {
        date: expenseDate,
        store: expenseStore.trim(),
        amount: expenseAmount,
        categoryId: expenseCategoryId,
        createdAt: new Date().toISOString(),
      }

      // Only add notes field if it has a value
      if (expenseNotes.trim()) {
        expenseData.notes = expenseNotes.trim()
      }

      await addDoc(collection(db, 'expenses'), expenseData)

      // Reset form
      setExpenseStore('')
      setExpenseAmount(0)
      setExpenseNotes('')

      setStatus('✓ Expense added')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error adding expense:', error)
      setStatus('Error adding expense')
    }
  }

  async function addIncome() {
    if (!incomeSource.trim()) {
      setStatus('Error: Source required')
      return
    }

    try {
      const incomeData: Income = {
        date: incomeDate,
        source: incomeSource.trim(),
        amount: incomeAmount,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'income'), incomeData)

      // Reset form
      setIncomeSource('')
      setIncomeAmount(0)

      setStatus('✓ Income added')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error adding income:', error)
      setStatus('Error adding income')
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

      // Delete old targets and create new (simple approach)
      const snapshot = await getDocs(collection(db, 'budget_targets'))
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref)
      }

      await addDoc(collection(db, 'budget_targets'), budgetData)

      setStatus('✓ Budget targets saved')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error saving budget targets:', error)
      setStatus('Error saving budget targets')
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>Finance Tracking</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Manage categories, track expenses and income
      </p>

      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'categories' ? '#0066cc' : 'transparent',
            color: activeTab === 'categories' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'expenses' ? '#0066cc' : 'transparent',
            color: activeTab === 'expenses' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add Expense
        </button>
        <button
          onClick={() => setActiveTab('income')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'income' ? '#0066cc' : 'transparent',
            color: activeTab === 'income' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add Income
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'budget' ? '#0066cc' : 'transparent',
            color: activeTab === 'budget' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Budget Targets
        </button>
      </div>

      {activeTab === 'categories' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Expense Categories</h2>

          <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
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
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={addCategory}
              style={{
                padding: '8px 16px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Category
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '15px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{cat.name}</span>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Add Expense</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Date
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Store/Vendor
            </label>
            <input
              type="text"
              value={expenseStore}
              onChange={(e) => setExpenseStore(e.target.value)}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Category
            </label>
            <select
              value={expenseCategoryId}
              onChange={(e) => setExpenseCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Notes (optional)
            </label>
            <textarea
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            onClick={addExpense}
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
            Add Expense
          </button>
        </div>
      )}

      {activeTab === 'income' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Add Income</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Date
            </label>
            <input
              type="date"
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Source
            </label>
            <input
              type="text"
              value={incomeSource}
              onChange={(e) => setIncomeSource(e.target.value)}
              placeholder="e.g., Salary, Freelance, etc."
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(parseFloat(e.target.value) || 0)}
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

          <button
            onClick={addIncome}
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
            Add Income
          </button>
        </div>
      )}

      {activeTab === 'budget' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Budget Targets</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Weekly Income Target
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={weeklyIncome}
              onChange={(e) => setWeeklyIncome(parseFloat(e.target.value) || 0)}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Weekly Spend Cap
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={weeklySpendCap}
              onChange={(e) => setWeeklySpendCap(parseFloat(e.target.value) || 0)}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
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
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
              e.g., 0.4 = 40% savings rate
            </p>
          </div>

          <button
            onClick={saveBudgetTargets}
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
            Save Budget Targets
          </button>
        </div>
      )}

      {status && (
        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            color: status.includes('Error') ? '#ef4444' : '#22c55e',
          }}
        >
          {status}
        </p>
      )}
    </div>
  )
}
