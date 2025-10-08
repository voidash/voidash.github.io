'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth'
import { db } from '@/lib/firebase'
import { app } from '@/lib/firebase'
import './admin.css'

const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

type Qn = {
  id: string
  created_at: string
  Name: string
  Question: string
  Answer: string
}

export default function AdminClient() {
  const [questions, setQuestions] = useState<Array<Qn>>([])
  const [questionSubmitted, setQuestionSubmitted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      setUser(user)
      setIsAdmin(user.email === 'ashish.thapa477@gmail.com')
      console.log('Signed in as:', user.displayName)
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  function handleSignOut() {
    signOut(auth)
    setUser(null)
    setIsAdmin(false)
  }

  async function updateAnswer(id: string, newAnswer: string) {
    try {
      const questionDoc = doc(db, 'questions', id)
      await updateDoc(questionDoc, { Answer: newAnswer })
      setQuestionSubmitted(true)
    } catch (e) {
      console.error('Error updating answer:', e)
    }
  }

  async function deleteQuestion(id: string) {
    try {
      const questionDoc = doc(db, 'questions', id)
      await deleteDoc(questionDoc)
      setQuestions((prev) => prev.filter((qna) => qna.id !== id))
      console.log(`Question with ID ${id} has been deleted.`)
    } catch (e) {
      console.error('Error deleting question:', e)
    }
  }

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const querySnapshot = await getDocs(collection(db, 'questions'))
        const data: Array<Qn> = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Array<Qn>
        setQuestions(data)
      } catch (error) {
        console.error('Error fetching questions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [questionSubmitted])

  return (
    <div>
      {!user ? (
        <div className="auth-section">
          <h3>Sign In Required</h3>
          <p style={{ marginBottom: '16px', color: 'rgba(100, 100, 100, 0.8)' }}>
            You need to sign in with an authorized Google account to access the admin panel.
          </p>
          <button onClick={signInWithGoogle} className="sign-in-button">
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="auth-section">
          <p style={{ marginBottom: '8px' }}>
            Signed in as: <strong>{user.displayName}</strong> ({user.email})
          </p>
          {!isAdmin && (
            <p style={{ color: '#d32f2f', marginBottom: '8px' }}>
              ⚠️ You are not authorized to manage questions. Only ashish.thapa477@gmail.com can access admin features.
            </p>
          )}
          <button onClick={handleSignOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading questions...</div>
      ) : (
        <div className="questions-container">
          <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>
            All Questions ({questions.length})
          </h2>
          {questions.length === 0 ? (
            <p style={{ color: 'rgba(100, 100, 100, 0.6)' }}>No questions yet.</p>
          ) : (
            questions.map((qna) => (
              <div className="admin-qna" key={qna.id}>
                <div className="question-header">
                  <div className="question-text">{qna.Question}</div>
                  <div className="asker-info">
                    <div className="avatar">{qna.Name[0]?.toUpperCase() || '?'}</div>
                    <div className="name">{qna.Name}</div>
                  </div>
                </div>

                <div className="answer-section">
                  <div className="answer-label">
                    {qna.Answer !== '' ? 'Answer:' : 'Not Answered Yet'}
                  </div>
                  {qna.Answer && <div className="current-answer">{qna.Answer}</div>}

                  {isAdmin && (
                    <div className="admin-controls">
                      <textarea
                        className="answer-textarea"
                        placeholder="Type an answer..."
                        defaultValue={qna.Answer}
                        onFocus={() => setQuestionSubmitted(false)}
                        onBlur={(e) => {
                          if (e.target.value !== qna.Answer) {
                            updateAnswer(qna.id, e.target.value)
                          }
                        }}
                      />
                      <button
                        className="delete-button"
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to delete this question?'
                            )
                          ) {
                            deleteQuestion(qna.id)
                          }
                        }}
                      >
                        Delete Question
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
