import { db } from './firebase'
import { collection, addDoc, query, getDocs, deleteDoc, doc as firestoreDoc } from 'firebase/firestore'
import { CalculatedScores } from './metrics-calculator'

export type PublicMetricsSnapshot = {
  currentWeek: {
    weekStart: string
    weekEnd: string
    scores: CalculatedScores
  }
  allWeeks: Array<{
    weekStart: string
    weekEnd: string
    scores: CalculatedScores
  }>
  updatedAt: string
}

export async function savePublicMetrics(data: PublicMetricsSnapshot): Promise<void> {
  try {
    // Delete all existing public metrics (we only keep one snapshot)
    const existingQuery = query(collection(db, 'public_metrics'))
    const existingSnapshot = await getDocs(existingQuery)

    const deletePromises = existingSnapshot.docs.map((doc) =>
      deleteDoc(firestoreDoc(db, 'public_metrics', doc.id))
    )
    await Promise.all(deletePromises)

    // Save new snapshot
    await addDoc(collection(db, 'public_metrics'), {
      ...data,
      updatedAt: new Date().toISOString(),
    })

    console.log('Public metrics saved successfully')
  } catch (error) {
    console.error('Error saving public metrics:', error)
    throw error
  }
}
