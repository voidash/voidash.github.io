'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc as firestoreDoc, orderBy } from 'firebase/firestore'
import { LearningItem, DifficultyRating } from '@/lib/learning-types'
import { calculateNextReview, createNewLearningItem, getDueItems, calculateStats } from '@/lib/spaced-repetition'

export function useLearningItems(userId: string | null) {
  const [allItems, setAllItems] = useState<LearningItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dueItems, setDueItems] = useState<LearningItem[]>([])

  // Fetch all learning items
  useEffect(() => {
    if (!userId) {
      setAllItems([])
      setDueItems([])
      setLoading(false)
      return
    }

    async function fetchItems() {
      try {
        setLoading(true)
        console.log('📖 Fetching learning items for userId:', userId)

        const q = query(
          collection(db, 'learning_items'),
          where('userId', '==', userId),
          orderBy('nextReviewDate', 'asc')
        )
        const snapshot = await getDocs(q)
        console.log('📊 Found', snapshot.docs.length, 'learning items')

        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as LearningItem))

        setAllItems(items)

        // Calculate due items for today
        const today = new Date().toISOString().split('T')[0]
        const due = getDueItems(items, today)
        console.log('🔔', due.length, 'items due today')
        setDueItems(due)
      } catch (error) {
        console.error('❌ Error fetching learning items:', error)
        if (error instanceof Error) {
          console.error('Error details:', error.message)
          if (error.message.includes('index')) {
            console.error('⚠️ FIRESTORE INDEX REQUIRED! Check the error message for the index creation link.')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [userId])

  /**
   * Add a new learning item
   */
  async function addLearningItem(
    text: string,
    sourceDate: string,
    sourceType: 'learn' | 'review'
  ): Promise<boolean> {
    if (!userId) return false

    try {
      // Check if this item already exists for this user
      const q = query(
        collection(db, 'learning_items'),
        where('userId', '==', userId),
        where('text', '==', text)
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        // Item exists - update the relatedDates array
        const existingDoc = snapshot.docs[0]
        const existingItem = existingDoc.data() as LearningItem
        const relatedDates = existingItem.relatedDates || []

        if (!relatedDates.includes(sourceDate)) {
          await updateDoc(firestoreDoc(db, 'learning_items', existingDoc.id), {
            relatedDates: [...relatedDates, sourceDate]
          })
        }

        return true
      }

      // Create new item
      const newItem = createNewLearningItem(userId, text, sourceDate, sourceType)
      await addDoc(collection(db, 'learning_items'), newItem)

      // Refresh items
      await refreshItems()
      return true
    } catch (error) {
      console.error('Error adding learning item:', error)
      return false
    }
  }

  /**
   * Review an item with a difficulty rating
   */
  async function reviewItem(
    itemId: string,
    rating: DifficultyRating
  ): Promise<boolean> {
    if (!userId) return false

    try {
      const item = allItems.find(i => i.id === itemId)
      if (!item) return false

      const today = new Date().toISOString().split('T')[0]
      const nextReview = calculateNextReview(item, rating, today)

      await updateDoc(firestoreDoc(db, 'learning_items', itemId), {
        lastReviewDate: today,
        nextReviewDate: nextReview.nextReviewDate,
        interval: nextReview.interval,
        easeFactor: nextReview.easeFactor,
        repetitions: nextReview.repetitions,
        status: nextReview.status,
      })

      // Refresh items
      await refreshItems()
      return true
    } catch (error) {
      console.error('Error reviewing item:', error)
      return false
    }
  }

  /**
   * Update notes for an item
   */
  async function updateNotes(itemId: string, notes: string): Promise<boolean> {
    if (!userId) return false

    try {
      await updateDoc(firestoreDoc(db, 'learning_items', itemId), {
        notes
      })

      // Update local state
      setAllItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, notes } : item
      ))

      return true
    } catch (error) {
      console.error('Error updating notes:', error)
      return false
    }
  }

  /**
   * Suspend an item (remove from review rotation)
   */
  async function suspendItem(itemId: string): Promise<boolean> {
    if (!userId) return false

    try {
      await updateDoc(firestoreDoc(db, 'learning_items', itemId), {
        status: 'suspended'
      })

      await refreshItems()
      return true
    } catch (error) {
      console.error('Error suspending item:', error)
      return false
    }
  }

  /**
   * Unsuspend an item (add back to review rotation)
   */
  async function unsuspendItem(itemId: string): Promise<boolean> {
    if (!userId) return false

    try {
      const item = allItems.find(i => i.id === itemId)
      if (!item) return false

      // Determine appropriate status based on repetitions
      const status = item.repetitions === 0 ? 'new' :
                     item.repetitions < 2 ? 'learning' : 'review'

      await updateDoc(firestoreDoc(db, 'learning_items', itemId), {
        status
      })

      await refreshItems()
      return true
    } catch (error) {
      console.error('Error unsuspending item:', error)
      return false
    }
  }

  /**
   * Delete an item permanently
   */
  async function deleteItem(itemId: string): Promise<boolean> {
    if (!userId) return false
    if (!confirm('Are you sure you want to delete this learning item?')) return false

    try {
      await deleteDoc(firestoreDoc(db, 'learning_items', itemId))
      setAllItems(prev => prev.filter(item => item.id !== itemId))
      setDueItems(prev => prev.filter(item => item.id !== itemId))
      return true
    } catch (error) {
      console.error('Error deleting item:', error)
      return false
    }
  }

  /**
   * Refresh items from database
   */
  async function refreshItems() {
    if (!userId) return

    try {
      const q = query(
        collection(db, 'learning_items'),
        where('userId', '==', userId),
        orderBy('nextReviewDate', 'asc')
      )
      const snapshot = await getDocs(q)
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LearningItem))

      setAllItems(items)

      const today = new Date().toISOString().split('T')[0]
      const due = getDueItems(items, today)
      setDueItems(due)
    } catch (error) {
      console.error('Error refreshing items:', error)
    }
  }

  /**
   * Get items due on a specific date
   */
  function getItemsDueOn(date: string): LearningItem[] {
    return getDueItems(allItems, date)
  }

  /**
   * Get learning statistics
   */
  function getStats() {
    const today = new Date().toISOString().split('T')[0]
    return calculateStats(allItems, today)
  }

  return {
    allItems,
    dueItems,
    loading,
    addLearningItem,
    reviewItem,
    updateNotes,
    suspendItem,
    unsuspendItem,
    deleteItem,
    refreshItems,
    getItemsDueOn,
    getStats,
  }
}
