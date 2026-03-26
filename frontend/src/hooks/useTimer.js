import { useState, useEffect, useRef } from 'react'

export function useTimer(initialSeconds = 2700, onExpire) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const formatted = {
    display: `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
    isCritical: seconds < 300,
    isWarning: seconds < 900,
  }

  return { seconds, formatted }
}
