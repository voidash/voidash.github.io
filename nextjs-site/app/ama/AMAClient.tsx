'use client'

import { useEffect, useState } from 'react'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import './ama.css'

type Qn = {
  id: string
  created_at: string
  Name: string
  Question: string
  Answer: string
}

export default function AMAClient() {
  const [questionTab, activateQuestionTab] = useState(false)
  const [questions, setQuestions] = useState<Array<Qn>>([])
  const [questionSubmitted, setQuestionSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [qn, setQn] = useState('')
  const [loading, setLoading] = useState(true)

  async function submitQN() {
    try {
      await addDoc(collection(db, 'questions'), {
        Name: name,
        Question: qn,
        Answer: '',
        created_at: new Date().toISOString(),
      })
      setQuestionSubmitted(true)
      activateQuestionTab(false)
      setName('')
      setQn('')
    } catch (e) {
      console.error('Error adding document: ', e)
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
    <>
      <h5 style={{ marginBottom: '20px' }}>
        Anyone can ask questions. It's anonymous. I will answer it promptly. If something urgent
        then you can always mail me at ashish.thapa477{"<at>"}gmail.com
      </h5>

      <button
        className="button"
        onClick={() => {
          activateQuestionTab(!questionTab)
          setQuestionSubmitted(false)
        }}
      >
        Ask your Question
      </button>

      {questionTab && (
        <div className="input-form">
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-bar"
            placeholder="Name"
          />
          <br />
          <textarea
            id="question"
            value={qn}
            onChange={(e) => setQn(e.target.value)}
            className="input-bar"
            placeholder="Question"
            required
          />
          <br />
          <input
            type="submit"
            value="Submit"
            className="button"
            onClick={() => {
              submitQN()
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="spinner" style={{ marginTop: '40px' }}>Loading...</div>
      ) : (
        questions.map((qna) => (
          <div className="qna" key={qna.id}>
            <div className="question">{qna.Question}</div>
            <div className="asker">
              <div className="avatar">{qna.Name[0]?.toUpperCase() || '?'}</div>
              <div className="name">{qna.Name}</div>
            </div>
            <div className="answer">
              <p style={{ textDecoration: 'underline' }}>My answer</p>
              {qna.Answer === '' ? 'Not Yet Answered' : qna.Answer}
            </div>
          </div>
        ))
      )}
    </>
  )
}
