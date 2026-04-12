'use client'

import { useEffect, useState } from 'react'

interface Props {
  initialCount: number
  userId: string
  mobile?: boolean
}

export function NotificationListener({ initialCount, userId, mobile }: Props) {
  const [unreadCount, setUnreadCount] = useState(initialCount)

  useEffect(() => {
    // 1. Conexión Real-Time (SSE)
    const eventSource = new EventSource('/api/timeline/stream')
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_notification' && data.recipientId === userId) {
          setUnreadCount(prev => prev + 1)
        }
      } catch {}
    }

    // 2. Polling de respaldo
    const checkUnread = async () => {
      try {
        const res = await fetch('/api/notifications/count')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.count)
        }
      } catch (error) {}
    }

    checkUnread()
    const interval = setInterval(checkUnread, 10000)

    return () => {
      eventSource.close()
      clearInterval(interval)
    }
  }, [userId])

  if (unreadCount === 0) return null

  // Styles change slightly depending on whether it's in MobileNav or Desktop Sidebar
  const classNames = mobile 
    ? "absolute top-2 right-1.5 bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black"
    : "absolute top-2 left-10 xl:left-9 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black animate-in zoom-in duration-200"

  return (
    <span className={classNames}>
      {unreadCount}
    </span>
  )
}

