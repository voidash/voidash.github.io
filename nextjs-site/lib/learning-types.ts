export type DifficultyRating = 'again' | 'hard' | 'good' | 'easy'

export interface LearningItem {
  id?: string
  userId: string // Owner of this learning item
  text: string
  sourceDate: string // Date when this was first logged
  sourceType: 'learn' | 'review' // Which tag it came from
  createdAt: string

  // Spaced repetition state
  lastReviewDate: string | null // Last time this was reviewed
  nextReviewDate: string // When this should be reviewed next
  easeFactor: number // SM-2 ease factor (default 2.5)
  interval: number // Days until next review
  repetitions: number // Number of successful reviews

  // Status
  status: 'new' | 'learning' | 'review' | 'suspended'

  // Additional context
  notes?: string // User notes about this item
  relatedDates?: string[] // Other dates this item appeared
}

export interface ReviewResult {
  itemId: string
  rating: DifficultyRating
  reviewedAt: string
  previousInterval: number
  newInterval: number
  previousEaseFactor: number
  newEaseFactor: number
}

export interface LearningStats {
  totalItems: number
  newItems: number
  learningItems: number
  reviewItems: number
  dueToday: number
  dueThisWeek: number
  averageEaseFactor: number
  longestStreak: number
}
