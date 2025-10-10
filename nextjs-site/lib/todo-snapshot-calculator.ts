/**
 * Calculates todo snapshots for a week by analyzing the todos collection
 */

import { TodoItem } from './task-parser'
import { TodoSnapshot } from './metrics-types'

type TodoSnapshotData = {
  label: 'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'
  openCount: number
  addedCount: number
  closedCount: number
}

/**
 * Calculates todo snapshot data for a specific week and label
 *
 * Logic:
 * - openCount (s0): Todos that existed before the week started and were not completed
 * - addedCount: Todos created during the week (sourceDate in week range)
 * - closedCount: Todos completed during the week (completedDate in week range)
 *
 * @param allTodos - All todos from the database
 * @param weekStart - Week start date (YYYY-MM-DD)
 * @param weekEnd - Week end date (YYYY-MM-DD)
 * @param label - The todo category
 */
export function calculateTodoSnapshot(
  allTodos: TodoItem[],
  weekStart: string,
  weekEnd: string,
  label: 'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'
): TodoSnapshotData {
  // Filter todos for this label
  const labelTodos = allTodos.filter(todo => todo.label === label)

  // openCount: Todos that existed before week start and were not yet completed
  // (created before weekStart, and either not completed OR completed after weekStart)
  const openCount = labelTodos.filter(todo => {
    const createdBeforeWeek = todo.sourceDate < weekStart
    const notCompletedYet = !todo.completed
    const completedDuringOrAfterWeek = todo.completed && todo.completedDate && todo.completedDate >= weekStart

    return createdBeforeWeek && (notCompletedYet || completedDuringOrAfterWeek)
  }).length

  // addedCount: Todos created during the week
  const addedCount = labelTodos.filter(todo => {
    return todo.sourceDate >= weekStart && todo.sourceDate <= weekEnd
  }).length

  // closedCount: Todos completed during the week
  const closedCount = labelTodos.filter(todo => {
    return todo.completed && todo.completedDate &&
           todo.completedDate >= weekStart && todo.completedDate <= weekEnd
  }).length

  return {
    label,
    openCount,
    addedCount,
    closedCount
  }
}

/**
 * Calculates todo snapshots for all labels for a specific week
 *
 * @param allTodos - All todos from the database
 * @param weekStart - Week start date (YYYY-MM-DD)
 * @param weekEnd - Week end date (YYYY-MM-DD)
 */
export function calculateAllTodoSnapshots(
  allTodos: TodoItem[],
  weekStart: string,
  weekEnd: string
): TodoSnapshotData[] {
  const labels: Array<'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'> = [
    'learning',
    'producer',
    'finance',
    'fitness',
    'relationship'
  ]

  return labels.map(label => calculateTodoSnapshot(allTodos, weekStart, weekEnd, label))
}
