import { useEffect, useState } from 'react'
import { toISODate } from '@/lib/dates'

// Returns today's date ('YYYY-MM-DD') and re-renders when the day changes,
// e.g. when the installed app is reopened the next morning.
export function useToday(): string {
  const [today, setToday] = useState(() => toISODate(new Date()))

  useEffect(() => {
    const check = () => setToday(toISODate(new Date()))
    const timer = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])

  return today
}
