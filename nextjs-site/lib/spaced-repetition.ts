import { DifficultyRating, LearningItem } from './learning-types'

/**
 * SM-2 Spaced Repetition Algorithm (similar to Anki)
 *
 * Algorithm overview:
 * - New items start with interval of 1 day
 * - After first successful review: 6 days
 * - After subsequent reviews: previous interval * ease factor
 * - Ease factor adjusts based on difficulty rating
 * - Failed reviews reset to learning phase
 */

const EASE_FACTOR_MIN = 1.3
const EASE_FACTOR_DEFAULT = 2.5
const EASE_FACTOR_MAX = 3.0

const INITIAL_INTERVAL = 1 // 1 day for new cards
const GRADUATING_INTERVAL = 6 // 6 days after first successful review

/**
 * Calculate the next review date based on difficulty rating
 */
export function calculateNextReview(
  item: LearningItem,
  rating: DifficultyRating,
  reviewDate: string = new Date().toISOString().split('T')[0]
): {
  nextReviewDate: string
  interval: number
  easeFactor: number
  repetitions: number
  status: 'new' | 'learning' | 'review' | 'suspended'
} {
  const currentDate = new Date(reviewDate)
  let easeFactor = item.easeFactor
  let interval = item.interval
  let repetitions = item.repetitions
  let status = item.status

  switch (rating) {
    case 'again':
      // Failed - reset to learning phase
      easeFactor = Math.max(EASE_FACTOR_MIN, easeFactor - 0.2)
      interval = INITIAL_INTERVAL
      repetitions = 0
      status = 'learning'
      break

    case 'hard':
      // Difficult - reduce ease factor, shorter interval
      easeFactor = Math.max(EASE_FACTOR_MIN, easeFactor - 0.15)

      if (repetitions === 0) {
        interval = INITIAL_INTERVAL
        status = 'learning'
      } else if (repetitions === 1) {
        interval = GRADUATING_INTERVAL
        status = 'review'
      } else {
        interval = Math.ceil(interval * 1.2) // 20% increase
        status = 'review'
      }
      repetitions += 1
      break

    case 'good':
      // Normal - standard progression
      if (repetitions === 0) {
        interval = INITIAL_INTERVAL
        status = 'learning'
      } else if (repetitions === 1) {
        interval = GRADUATING_INTERVAL
        status = 'review'
      } else {
        interval = Math.ceil(interval * easeFactor)
        status = 'review'
      }
      repetitions += 1
      break

    case 'easy':
      // Easy - increase ease factor, longer interval
      easeFactor = Math.min(EASE_FACTOR_MAX, easeFactor + 0.15)

      if (repetitions === 0) {
        // Graduate immediately with bonus
        interval = GRADUATING_INTERVAL * 1.5
        status = 'review'
      } else if (repetitions === 1) {
        interval = GRADUATING_INTERVAL * 1.5
        status = 'review'
      } else {
        interval = Math.ceil(interval * easeFactor * 1.3) // 30% bonus
        status = 'review'
      }
      repetitions += 1
      break
  }

  // Calculate next review date
  const nextReviewDate = new Date(currentDate)
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    nextReviewDate: nextReviewDate.toISOString().split('T')[0],
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimals
    repetitions,
    status,
  }
}

/**
 * Create a new learning item with default SM-2 values
 * nextReviewDate is calculated from sourceDate + 1 day, not from today
 */
export function createNewLearningItem(
  userId: string,
  text: string,
  sourceDate: string,
  sourceType: 'learn' | 'review'
): Omit<LearningItem, 'id'> {
  // Calculate next review date from the SOURCE date, not today
  // If you learned something on Jan 15, next review should be Jan 16
  // Even if you log it later (e.g., on Jan 20), the review schedule
  // should be based on when you actually learned it
  const sourceDateTime = new Date(sourceDate)
  sourceDateTime.setDate(sourceDateTime.getDate() + INITIAL_INTERVAL)
  const nextReviewDate = sourceDateTime.toISOString().split('T')[0]

  return {
    userId,
    text,
    sourceDate,
    sourceType,
    createdAt: new Date().toISOString(),
    lastReviewDate: null,
    nextReviewDate,
    easeFactor: EASE_FACTOR_DEFAULT,
    interval: INITIAL_INTERVAL,
    repetitions: 0,
    status: 'new',
  }
}

/**
 * Check if an item is due for review
 */
export function isDue(item: LearningItem, currentDate: string = new Date().toISOString().split('T')[0]): boolean {
  return item.nextReviewDate <= currentDate
}

/**
 * Get items due for review on a specific date
 */
export function getDueItems(items: LearningItem[], date: string = new Date().toISOString().split('T')[0]): LearningItem[] {
  return items.filter(item => isDue(item, date) && item.status !== 'suspended')
}

/**
 * Calculate learning statistics
 */
export function calculateStats(items: LearningItem[], currentDate: string = new Date().toISOString().split('T')[0]): {
  totalItems: number
  newItems: number
  learningItems: number
  reviewItems: number
  dueToday: number
  dueThisWeek: number
  averageEaseFactor: number
} {
  const weekFromNow = new Date(currentDate)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  const weekDate = weekFromNow.toISOString().split('T')[0]

  const newItems = items.filter(i => i.status === 'new').length
  const learningItems = items.filter(i => i.status === 'learning').length
  const reviewItems = items.filter(i => i.status === 'review').length
  const dueToday = getDueItems(items, currentDate).length
  const dueThisWeek = items.filter(i => i.nextReviewDate <= weekDate && i.status !== 'suspended').length

  const activeItems = items.filter(i => i.status !== 'suspended')
  const averageEaseFactor = activeItems.length > 0
    ? activeItems.reduce((sum, item) => sum + item.easeFactor, 0) / activeItems.length
    : EASE_FACTOR_DEFAULT

  return {
    totalItems: items.length,
    newItems,
    learningItems,
    reviewItems,
    dueToday,
    dueThisWeek,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
  }
}

/**
 * Get the next interval preview for each difficulty rating
 */
export function getIntervalPreview(item: LearningItem): Record<DifficultyRating, number> {
  return {
    again: INITIAL_INTERVAL,
    hard: item.repetitions === 0 ? INITIAL_INTERVAL :
          item.repetitions === 1 ? GRADUATING_INTERVAL :
          Math.ceil(item.interval * 1.2),
    good: item.repetitions === 0 ? INITIAL_INTERVAL :
          item.repetitions === 1 ? GRADUATING_INTERVAL :
          Math.ceil(item.interval * item.easeFactor),
    easy: item.repetitions === 0 ? Math.ceil(GRADUATING_INTERVAL * 1.5) :
          item.repetitions === 1 ? Math.ceil(GRADUATING_INTERVAL * 1.5) :
          Math.ceil(item.interval * item.easeFactor * 1.3),
  }
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days < 1) return 'today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? '1 month' : `${months} months`
  }
  const years = Math.floor(days / 365)
  return years === 1 ? '1 year' : `${years} years`
}
