/**
 * Aggregates Firebase daily logs, weekly logs, and todo snapshots
 * into the WeeklyMetricsData format for metrics calculation
 */

import { DailyLog, WeeklyLog, TodoSnapshot, Expense, Income, BudgetTarget } from './metrics-types'
import { WeeklyMetricsData } from './metrics-calculator'
import { parseMarkdownTasks, countCompletedTasks, extractWeeklyTaskData, TodoItem } from './task-parser'
import { calculateAllTodoSnapshots } from './todo-snapshot-calculator'

function getWeekDates(mondayStr: string): { start: string; end: string } {
  const start = new Date(mondayStr)
  const end = new Date(mondayStr)
  end.setDate(end.getDate() + 6)
  return {
    start: mondayStr,
    end: end.toISOString().split('T')[0],
  }
}

function isDateInWeek(dateStr: string, weekStart: string, weekEnd: string): boolean {
  return dateStr >= weekStart && dateStr <= weekEnd
}

export function aggregateMetrics(
  dailyLogs: DailyLog[],
  weeklyLog: WeeklyLog | null,
  allTodos: TodoItem[] = [],
  expenses: Expense[] = [],
  incomes: Income[] = [],
  budgetTarget: BudgetTarget | null = null
): WeeklyMetricsData {
  if (!weeklyLog) {
    throw new Error('Weekly log is required')
  }

  // Use the weekEnd from the weekly log directly, don't recalculate
  const weekStart = weeklyLog.weekStart
  const weekEnd = weeklyLog.weekEnd
  const weekLogs = dailyLogs.filter((log) => isDateInWeek(log.date, weekStart, weekEnd))

  // Calculate todo snapshots automatically from todos collection
  const calculatedSnapshots = calculateAllTodoSnapshots(allTodos, weekStart, weekEnd)

  // Parse all markdown tasks from daily logs
  const allTaskCounts = weekLogs.map((log) => {
    const tasks = parseMarkdownTasks(log.tasksMarkdown)
    return countCompletedTasks(tasks)
  })

  // Daily logged days (where logged === true)
  const loggedDays = weekLogs.filter((log) => log.logged).length

  // Learning - aggregate from task tags
  const learningLoggedDays = weekLogs.filter((log) => log.logged).length
  const learningArtifactsCount = allTaskCounts.reduce((sum, counts) => sum + counts.learningArtifacts, 0)
  const revisionNotesCreated = allTaskCounts.reduce((sum, counts) => sum + counts.revisionNotesCreated, 0)
  const revisionRevisitPoints = allTaskCounts.reduce((sum, counts) => sum + counts.revisionPointsReviewed, 0)

  const learningSnapshot = calculatedSnapshots.find((s) => s.label === 'learning')
  const learningTodoData = learningSnapshot
    ? { s0: learningSnapshot.openCount, add: learningSnapshot.addedCount, close: learningSnapshot.closedCount }
    : { s0: 0, add: 0, close: 0 }

  // Producer - aggregate from task tags
  const publicOutputsCount = allTaskCounts.reduce((sum, counts) => sum + counts.publicOutputs, 0)

  const producerSnapshot = calculatedSnapshots.find((s) => s.label === 'producer')
  const producerTodoData = producerSnapshot
    ? { s0: producerSnapshot.openCount, add: producerSnapshot.addedCount, close: producerSnapshot.closedCount }
    : { s0: 0, add: 0, close: 0 }

  // Finance - use CUMULATIVE (all-time) expenses and income up to this week
  // Only count expenses/income that happened on or before the week end date
  const allExpensesUpToWeek = expenses.filter((exp) => exp.date <= weekEnd)
  const allIncomesUpToWeek = incomes.filter((inc) => inc.date <= weekEnd)

  const totalSpend = allExpensesUpToWeek.reduce((sum, exp) => sum + exp.amount, 0)
  const totalIncome = allIncomesUpToWeek.reduce((sum, inc) => sum + inc.amount, 0)

  // Finance tracking is only active if finance todos exist OR finance data exists
  const financeSnapshot = calculatedSnapshots.find((s) => s.label === 'finance')
  const financeTodoData = financeSnapshot
    ? { s0: financeSnapshot.openCount, add: financeSnapshot.addedCount, close: financeSnapshot.closedCount }
    : { s0: 0, add: 0, close: 0 }

  const hasFinanceData = totalIncome > 0 || totalSpend > 0 || (financeTodoData.s0 + financeTodoData.add + financeTodoData.close) > 0

  // Fitness - aggregate from checkbox and weight field
  const fitnessLoggedDays = weekLogs.filter((log) => log.logged).length
  const gymSessions = weekLogs.filter((log) => log.gymSession).length

  // Calculate actual average weight from daily logs
  const weightsThisWeek = weekLogs.filter((log) => log.weight && log.weight > 0).map((log) => log.weight!)
  const avgWeightActual = weightsThisWeek.length > 0 ? weightsThisWeek.reduce((a, b) => a + b, 0) / weightsThisWeek.length : 0

  const caloriesTrackedDays = weekLogs.filter((log) => log.caloriesTracked).length

  const fitnessSnapshot = calculatedSnapshots.find((s) => s.label === 'fitness')
  const fitnessTodoData = fitnessSnapshot
    ? { s0: fitnessSnapshot.openCount, add: fitnessSnapshot.addedCount, close: fitnessSnapshot.closedCount }
    : { s0: 0, add: 0, close: 0 }

  // Relationship - aggregate from task tags
  const newInteractions = allTaskCounts.reduce((sum, counts) => sum + counts.newInteractions, 0)
  const familyCalls = allTaskCounts.reduce((sum, counts) => sum + counts.familyCalls, 0)
  const unresolvedConflicts = allTaskCounts.some((counts) => counts.unresolvedConflicts > 0) ? 1 : 0

  const relationshipSnapshot = calculatedSnapshots.find((s) => s.label === 'relationship')
  const relationshipTodoData = relationshipSnapshot
    ? { s0: relationshipSnapshot.openCount, add: relationshipSnapshot.addedCount, close: relationshipSnapshot.closedCount }
    : { s0: 0, add: 0, close: 0 }

  // Extract weekly task data from markdown (fallback if fields not set)
  const weeklyTaskData = extractWeeklyTaskData(weeklyLog.tasksMarkdown)

  // Use explicit weekly log fields if available, otherwise fall back to markdown parsing
  const financeConceptApplied = weeklyLog.financeConceptApplied || weeklyTaskData.financeConceptApplied
  const portfolioReview = weeklyLog.portfolioReview || weeklyTaskData.portfolioReview

  return {
    management: {
      weeklyLogSetup: true, // If weekly log exists, it's set up
      dailyLoggedDays: loggedDays,
      financeLogSetup: hasFinanceData, // Finance tracking only active if data exists
    },
    learning: {
      loggedDays: learningLoggedDays,
      learningArtifactsCount,
      revisionNotesCreated,
      revisionRevisitPoints,
      learningTodo: learningTodoData,
    },
    producer: {
      publicOutputsCount,
      producerTodo: producerTodoData,
    },
    finance: {
      income: totalIncome,
      spend: totalSpend,
      spendCap: budgetTarget?.weeklySpendCap || 0,
      targetSavingsRate: budgetTarget?.targetSavingsRate || 0.4,
      financeConceptApplied,
      portfolioReview,
      financeTodo: financeTodoData,
    },
    fitness: {
      loggedDays: fitnessLoggedDays,
      gymSessions,
      avgWeightActual,
      targetWeight: weeklyLog.targetWeight,
      caloriesTrackedDays,
      fitnessTodo: fitnessTodoData,
    },
    relationship: {
      newInteractions,
      familyCalls,
      unresolvedConflicts,
      primaryRelationshipActive: weeklyLog.primaryRelationshipActive,
      relationshipTodo: relationshipTodoData,
    },
    targets: {
      artifactsPerWeek: 3,
      gymSessionsPerWeek: 3,
      newInteractionsPerWeek: 3,
      familyCallsPerWeek: 2,
    },
  }
}
