/**
 * Firebase document types for metrics tracking
 */

export type DailyLog = {
  date: string // YYYY-MM-DD
  logged: boolean
  tasksMarkdown: string // markdown with checkboxes and tags
  gymSession: boolean
  weight?: number
  caloriesTracked: boolean
  createdAt: string
}

export type WeeklyLog = {
  weekStart: string // YYYY-MM-DD (Monday)
  weekEnd: string // YYYY-MM-DD (Sunday)
  tasksMarkdown: string // weekly goals/plans with checkboxes
  targetWeight: number // target weight in kg for end of week
  primaryRelationshipActive: boolean
  financeConceptApplied?: 'none' | 'noted' | 'implemented'
  portfolioReview?: 'none' | 'reviewed' | 'ips_checked'
  createdAt: string
}

export type TodoSnapshot = {
  date: string // YYYY-MM-DD
  label: 'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'
  openCount: number
  addedCount: number
  closedCount: number
  createdAt: string
}

export type WeeklyTargets = {
  artifactsPerWeek: number
  gymSessionsPerWeek: number
  newInteractionsPerWeek: number
  familyCallsPerWeek: number
  targetSavingsRate: number
  updatedAt: string
}

export type ExpenseCategory = {
  id: string
  name: string
  createdAt: string
}

export type Expense = {
  date: string // YYYY-MM-DD
  store: string
  amount: number
  categoryId: string
  notes?: string
  createdAt: string
}

export type Income = {
  date: string // YYYY-MM-DD
  source: string
  amount: number
  createdAt: string
}

export type BudgetTarget = {
  weeklyIncome: number
  weeklySpendCap: number
  monthlyIncome: number
  monthlySpendCap: number
  yearlyIncome: number
  yearlySpendCap: number
  targetSavingsRate: number
  updatedAt: string
}
