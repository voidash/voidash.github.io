'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Mode = 'simple' | 'complex'

interface ModeContextType {
  mode: Mode
  setMode: (mode: Mode) => void
  isClient: boolean
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('simple')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('viewMode') as Mode | null
    if (savedMode) {
      setModeState(savedMode)
    }
  }, [])

  const setMode = (newMode: Mode) => {
    setModeState(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewMode', newMode)
    }
  }

  return (
    <ModeContext.Provider value={{ mode, setMode, isClient }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}
