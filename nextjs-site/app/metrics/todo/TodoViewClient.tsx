'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { DailyLog } from '@/lib/metrics-types'
import { extractTodos, TodoItem } from '@/lib/task-parser'
import Link from 'next/link'

export default function TodoViewClient() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLabel, setSelectedLabel] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)

  // Add todo form
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoLabel, setNewTodoLabel] = useState<'learning' | 'producer' | 'finance' | 'fitness' | 'relationship'>('learning')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchTodos()
  }, [])

  async function fetchTodos() {
    try {
      // Fetch todos from Firebase collection
      const todoQuery = query(collection(db, 'todos'), orderBy('createdAt', 'desc'))
      const todoSnapshot = await getDocs(todoQuery)
      const firestoreTodos: TodoItem[] = todoSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as TodoItem))

      // Also fetch todos from daily logs
      const dailyQuery = query(collection(db, 'daily_logs'), orderBy('date', 'desc'))
      const dailySnapshot = await getDocs(dailyQuery)

      const dailyLogTodos: TodoItem[] = []
      dailySnapshot.docs.forEach((doc) => {
        const log = doc.data() as DailyLog
        const logTodos = extractTodos(log.tasksMarkdown, log.date)
        dailyLogTodos.push(...logTodos)
      })

      // Merge both sources
      const allTodos = [...firestoreTodos, ...dailyLogTodos]
      setTodos(allTodos)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching todos:', error)
      setLoading(false)
    }
  }

  async function addTodo() {
    if (!newTodoText.trim()) {
      setStatus('Error: Todo text required')
      return
    }

    try {
      const todoData: TodoItem = {
        text: newTodoText.trim(),
        label: newTodoLabel,
        sourceDate: new Date().toISOString().split('T')[0],
        completed: false,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'todos'), todoData)

      setNewTodoText('')
      setShowAddForm(false)
      fetchTodos()

      setStatus('✓ Todo added')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error adding todo:', error)
      setStatus('Error adding todo')
    }
  }

  async function toggleTodoComplete(todo: TodoItem) {
    if (!todo.id) return // Can't update todos from daily logs

    try {
      const newCompleted = !todo.completed
      const updateData: any = {
        completed: newCompleted,
      }

      if (newCompleted) {
        updateData.completedDate = new Date().toISOString().split('T')[0]
      } else {
        updateData.completedDate = null
      }

      await updateDoc(doc(db, 'todos', todo.id), updateData)

      // Also update the daily log markdown where this todo came from
      await syncTodoToDailyLog(todo, newCompleted)

      fetchTodos()
    } catch (error) {
      console.error('Error updating todo:', error)
      setStatus('Error updating todo')
    }
  }

  async function syncTodoToDailyLog(todo: TodoItem, completed: boolean) {
    try {
      // Find the daily log for this todo's source date
      const q = query(collection(db, 'daily_logs'), where('date', '==', todo.sourceDate))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const logDoc = snapshot.docs[0]
        const logData = logDoc.data() as DailyLog
        let markdown = logData.tasksMarkdown

        // Find and update the checkbox for this todo
        const todoTag = `#${todo.label}-todo`
        const lines = markdown.split('\n')
        const updatedLines = lines.map(line => {
          // Check if this line contains the todo text and tag
          if (line.includes(todo.text) && line.includes(todoTag)) {
            // Update the checkbox state
            if (completed) {
              return line.replace(/^(\s*-\s*)\[\s*\]/, '$1[x]')
            } else {
              return line.replace(/^(\s*-\s*)\[x\]/i, '$1[ ]')
            }
          }
          return line
        })

        const updatedMarkdown = updatedLines.join('\n')

        // Update the daily log
        await updateDoc(doc(db, 'daily_logs', logDoc.id), {
          tasksMarkdown: updatedMarkdown
        })
      }
    } catch (error) {
      console.error('Error syncing todo to daily log:', error)
    }
  }

  async function deleteTodo(todo: TodoItem) {
    if (!todo.id) return // Can't delete todos from daily logs

    try {
      await deleteDoc(doc(db, 'todos', todo.id))
      fetchTodos()
      setStatus('✓ Todo deleted')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error deleting todo:', error)
      setStatus('Error deleting todo')
    }
  }

  const filteredTodos = selectedLabel === 'all'
    ? todos
    : todos.filter(t => t.label === selectedLabel)

  const todosByLabel = {
    learning: filteredTodos.filter(t => t.label === 'learning'),
    producer: filteredTodos.filter(t => t.label === 'producer'),
    finance: filteredTodos.filter(t => t.label === 'finance'),
    fitness: filteredTodos.filter(t => t.label === 'fitness'),
    relationship: filteredTodos.filter(t => t.label === 'relationship'),
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading todos...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/metrics" style={{ color: '#0066cc' }}>
          ← Back to Metrics
        </Link>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '6px 12px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Todo'}
        </button>
      </nav>

      <h1 style={{ marginBottom: '10px' }}>Todo Backlog</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Todos from daily logs and manually added
      </p>

      {showAddForm && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid var(--border-color)',
          }}
        >
          <h3 style={{ marginBottom: '15px' }}>Add New Todo</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Todo Text
            </label>
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="What needs to be done?"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Category
            </label>
            <select
              value={newTodoLabel}
              onChange={(e) => setNewTodoLabel(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="learning">Learning</option>
              <option value="producer">Producer</option>
              <option value="finance">Finance</option>
              <option value="fitness">Fitness</option>
              <option value="relationship">Relationship</option>
            </select>
          </div>

          <button
            onClick={addTodo}
            style={{
              width: '100%',
              padding: '10px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Add Todo
          </button>
        </div>
      )}

      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedLabel('all')}
          style={{
            padding: '8px 16px',
            background: selectedLabel === 'all' ? '#0066cc' : 'transparent',
            color: selectedLabel === 'all' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          All ({todos.length})
        </button>
        <button
          onClick={() => setSelectedLabel('learning')}
          style={{
            padding: '8px 16px',
            background: selectedLabel === 'learning' ? '#0066cc' : 'transparent',
            color: selectedLabel === 'learning' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Learning ({todosByLabel.learning.length})
        </button>
        <button
          onClick={() => setSelectedLabel('producer')}
          style={{
            padding: '8px 16px',
            background: selectedLabel === 'producer' ? '#0066cc' : 'transparent',
            color: selectedLabel === 'producer' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Producer ({todosByLabel.producer.length})
        </button>
        <button
          onClick={() => setSelectedLabel('finance')}
          style={{
            padding: '8px 16px',
            background: selectedLabel === 'finance' ? '#0066cc' : 'transparent',
            color: selectedLabel === 'finance' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Finance ({todosByLabel.finance.length})
        </button>
        <button
          onClick={() => setSelectedLabel('fitness')}
          style={{
            padding: '8px 16px',
            background: selectedLabel === 'fitness' ? '#0066cc' : 'transparent',
            color: selectedLabel === 'fitness' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Fitness ({todosByLabel.fitness.length})
        </button>
        <button
          onClick={() => setSelectedLabel('relationship')}
          style={{
            padding: '8px 16px',
            background: selectedLabel === 'relationship' ? '#0066cc' : 'transparent',
            color: selectedLabel === 'relationship' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Relationship ({todosByLabel.relationship.length})
        </button>
      </div>

      {filteredTodos.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <p>No todos found. Add todos manually or use tags like #learning-todo in daily logs.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTodos.map((todo, idx) => (
            <div
              key={todo.id || idx}
              style={{
                background: 'var(--bg-secondary)',
                padding: '15px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                opacity: todo.completed ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {todo.id && (
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodoComplete(todo)}
                    style={{
                      marginTop: '3px',
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      marginBottom: '8px',
                      textDecoration: todo.completed ? 'line-through' : 'none',
                    }}
                  >
                    {todo.text}
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span>{todo.label}</span>
                    <span>•</span>
                    <span>Added {todo.sourceDate}</span>
                    {todo.completedDate && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#22c55e' }}>Completed {todo.completedDate}</span>
                      </>
                    )}
                    {!todo.id && (
                      <>
                        <span>•</span>
                        <span style={{ fontStyle: 'italic' }}>From daily log</span>
                      </>
                    )}
                  </div>
                </div>
                {todo.id && (
                  <button
                    onClick={() => deleteTodo(todo)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {status && (
        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            color: status.includes('Error') ? '#ef4444' : '#22c55e',
          }}
        >
          {status}
        </p>
      )}
    </div>
  )
}
