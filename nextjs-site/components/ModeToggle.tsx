'use client'

import { useMode } from './ModeProvider'

export default function ModeToggle() {
  const { mode, setMode, isClient } = useMode()

  if (!isClient) {
    // Show simple mode indicator during SSR
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        padding: '10px 20px',
        background: '#333',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        Simple Mode
      </div>
    )
  }

  return (
    <button
      onClick={() => setMode(mode === 'simple' ? 'complex' : 'simple')}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        padding: '12px 24px',
        background: mode === 'simple' ? '#4CAF50' : '#2196F3',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {mode === 'simple' ? '📄 Simple' : '✨ Complex'} Mode
    </button>
  )
}
