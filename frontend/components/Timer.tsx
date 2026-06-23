'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'

interface TimerProps {
  seconds: number
  onExpire: () => void
}

export default function Timer({ seconds, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const expiredRef = useRef(false)

  useEffect(() => {
    setRemaining(seconds)
    expiredRef.current = false
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
      return
    }
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [remaining, onExpire])

  if (remaining <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
        <Clock className="h-4 w-4" />
        Session expired
      </div>
    )
  }

  const minutes = Math.floor(remaining / 60)
  const secs = remaining % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(
    secs,
  ).padStart(2, '0')}`

  let color = 'text-success border-success/40 bg-success/10'
  if (remaining < 60) color = 'text-danger border-danger/40 bg-danger/10'
  else if (remaining < 180)
    color = 'text-warning border-warning/40 bg-warning/10'

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 font-mono text-sm font-semibold tabular-nums ${color}`}
    >
      <Clock className="h-4 w-4" />
      {formatted}
    </div>
  )
}
