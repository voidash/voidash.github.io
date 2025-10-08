'use client'

import { useMode } from './ModeProvider'
import SimpleHomePage from './SimpleHomePage'
import { useEffect } from 'react'

export default function ComplexHomePage() {
  const { mode, isClient } = useMode()

  useEffect(() => {
    // Initialize moving gradient effect
    const gradient = document.querySelector('.moving-gradient') as HTMLDivElement
    if (!gradient) return

    const handleMouseMove = (event: MouseEvent) => {
      gradient.style.left = `${event.clientX}px`
      gradient.style.top = `${event.clientY}px`
    }

    document.body.addEventListener('mousemove', handleMouseMove)
    return () => document.body.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Show simple mode if not hydrated yet or if simple mode is selected
  if (!isClient || mode === 'simple') {
    return <SimpleHomePage />
  }

  return (
    <>
      <div className="moving-gradient"></div>
      <div className="backdrop-content unselectable">
        MEANING PSYCHOLOGY PHILOSOPHY INNATE CURIOSITY
      </div>
      <center>
        <h1>Ashish Thapa</h1>
      </center>
      {/* TODO: Add NavBoard and Window system */}
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Complex windowing mode - Migration in progress</p>
      </div>
    </>
  )
}
