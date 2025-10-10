/**
 * Parses markdown checkbox tasks and extracts tags
 *
 * Daily tags:
 * #learn - learning artifacts
 * #review - revision points reviewed
 * #new-review - new revision notes created
 * #produce - public outputs
 * #relationship - relationship interactions
 * #family - family call
 * #conflict-resolved - conflict resolved
 * #conflict-unresolved - unresolved conflict
 *
 * Weekly tags:
 * #finance-concept - finance concept applied
 * #portfolio-review - portfolio reviewed
 * #ips-check - IPS checked (full portfolio review)
 *
 * Todo tags:
 * #learning-todo - add to learning backlog
 * #producer-todo - add to producer backlog
 * #finance-todo - add to finance backlog
 * #fitness-todo - add to fitness backlog
 * #relationship-todo - add to relationship backlog
 */

export type ParsedTask = {
  completed: boolean
  text: string
  tags: string[]
}

export type TaskCounts = {
  learningArtifacts: number
  revisionPointsReviewed: number
  revisionNotesCreated: number
  publicOutputs: number
  newInteractions: number
  gymSessions: number
  familyCalls: number
  conflictsResolved: number
  unresolvedConflicts: number
}

export type WeeklyTaskData = {
  financeConceptApplied: 'none' | 'noted' | 'implemented'
  portfolioReview: 'none' | 'reviewed' | 'ips_checked'
}

export type TodoItem = {
  id?: string // Firebase document ID
  text: string
  label: 'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'
  sourceDate: string // Date when todo was added
  completed: boolean
  completedDate?: string // Date when todo was marked complete
  createdAt: string
}

export function parseMarkdownTasks(markdown: string): ParsedTask[] {
  const lines = markdown.split('\n')
  const tasks: ParsedTask[] = []

  for (const line of lines) {
    // Match checkbox format: - [ ] or - [x] or - [X]
    const match = line.match(/^[\s-]*\[([x X ])\]\s*(.*)$/i)
    if (match) {
      const completed = match[1].toLowerCase() === 'x'
      const text = match[2].trim()

      // Extract tags (words starting with #)
      const tags = text.match(/#[\w-]+/g) || []
      const cleanTags = tags.map(t => t.toLowerCase())

      tasks.push({
        completed,
        text,
        tags: cleanTags,
      })
    }
  }

  return tasks
}

export function countCompletedTasks(tasks: ParsedTask[]): TaskCounts {
  const completedTasks = tasks.filter(t => t.completed)

  return {
    learningArtifacts: completedTasks.filter(t => t.tags.includes('#learn')).length,
    revisionPointsReviewed: completedTasks.filter(t => t.tags.includes('#review')).length,
    revisionNotesCreated: completedTasks.filter(t => t.tags.includes('#new-review')).length,
    publicOutputs: completedTasks.filter(t => t.tags.includes('#produce')).length,
    newInteractions: completedTasks.filter(t => t.tags.includes('#relationship')).length,
    gymSessions: completedTasks.filter(t => t.tags.includes('#gym')).length,
    familyCalls: completedTasks.filter(t => t.tags.includes('#family')).length,
    conflictsResolved: completedTasks.filter(t => t.tags.includes('#conflict-resolved')).length,
    unresolvedConflicts: completedTasks.filter(t => t.tags.includes('#conflict-unresolved')).length,
  }
}

export function extractTodos(markdown: string, sourceDate: string): TodoItem[] {
  const tasks = parseMarkdownTasks(markdown)
  const todos: TodoItem[] = []

  const todoTagMap: Record<string, 'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'> = {
    '#learning-todo': 'learning',
    '#producer-todo': 'producer',
    '#finance-todo': 'finance',
    '#fitness-todo': 'fitness',
    '#relationship-todo': 'relationship',
  }

  for (const task of tasks) {
    for (const [tag, label] of Object.entries(todoTagMap)) {
      if (task.tags.includes(tag)) {
        // Remove the todo tag from text for cleaner display
        const cleanText = task.text.replace(tag, '').trim()
        todos.push({
          text: cleanText,
          label,
          sourceDate,
          completed: task.completed,
        })
        break // Only add once per task even if multiple todo tags
      }
    }
  }

  return todos
}

export function extractWeeklyTaskData(markdown: string): WeeklyTaskData {
  const tasks = parseMarkdownTasks(markdown)
  const completedTasks = tasks.filter(t => t.completed)

  // Check for finance concept tags
  let financeConceptApplied: 'none' | 'noted' | 'implemented' = 'none'
  const hasFinanceConcept = completedTasks.some(t => t.tags.includes('#finance-concept'))
  if (hasFinanceConcept) {
    financeConceptApplied = 'implemented'
  }

  // Check for portfolio review tags
  let portfolioReview: 'none' | 'reviewed' | 'ips_checked' = 'none'
  const hasIpsCheck = completedTasks.some(t => t.tags.includes('#ips-check'))
  const hasPortfolioReview = completedTasks.some(t => t.tags.includes('#portfolio-review'))

  if (hasIpsCheck) {
    portfolioReview = 'ips_checked'
  } else if (hasPortfolioReview) {
    portfolioReview = 'reviewed'
  }

  return {
    financeConceptApplied,
    portfolioReview,
  }
}

export function renderTaskPreview(markdown: string): string {
  const tasks = parseMarkdownTasks(markdown)
  const counts = countCompletedTasks(tasks)
  const totalTasks = tasks.length
  const completedCount = tasks.filter(t => t.completed).length
  const todos = extractTodos(markdown, '')

  let preview = `📊 ${completedCount}/${totalTasks} tasks completed\n\n`

  if (counts.learningArtifacts > 0) preview += `📚 ${counts.learningArtifacts} learning artifacts\n`
  if (counts.revisionNotesCreated > 0) preview += `📝 ${counts.revisionNotesCreated} new revision notes\n`
  if (counts.revisionPointsReviewed > 0) preview += `🔄 ${counts.revisionPointsReviewed} revision points reviewed\n`
  if (counts.publicOutputs > 0) preview += `🚀 ${counts.publicOutputs} public outputs\n`
  if (counts.newInteractions > 0) preview += `👥 ${counts.newInteractions} new interactions\n`
  if (counts.gymSessions > 0) preview += `💪 ${counts.gymSessions} gym sessions\n`
  if (counts.familyCalls > 0) preview += `📞 ${counts.familyCalls} family calls\n`
  if (counts.conflictsResolved > 0) preview += `✅ ${counts.conflictsResolved} conflicts resolved\n`
  if (counts.unresolvedConflicts > 0) preview += `⚠️ ${counts.unresolvedConflicts} unresolved conflicts\n`

  if (todos.length > 0) {
    preview += `\n📋 ${todos.length} todos added to backlog\n`
  }

  return preview.trim()
}
