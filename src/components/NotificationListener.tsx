'use client'

import { useEffect, useState } from 'react'

interface Props {
  initialCount: number
  userId: string
}

export function NotificationListener({ initialCount, userId }: Props) {
  const [unreadCount, setUnreadCount] = useState(initialCount)

  useEffect(() => {
    const eventSource = new EventSource('/api/timeline/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_notification') {
          // Solo incrementar si es para nosotros
          if (data.recipientId === userId) {
            setUnreadCount(prev => prev + 1)
          }
        }
      } catch {
        // Ignorar errores de parsing
      }
    }

    return () => eventSource.close()
  }, [userId])

  if (unreadCount === 0) return null

  return (
    <span className="absolute top-2 left-10 xl:left-9 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black animate-in zoom-in duration-200">
      {unreadCount}
    </span>
  )
}
