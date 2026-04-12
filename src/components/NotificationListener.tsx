'use client'

import { useEffect, useState } from 'react'

interface Props {
  initialCount: number
  userId: string
}

export function NotificationListener({ initialCount, userId }: Props) {
  const [unreadCount, setUnreadCount] = useState(initialCount)

  useEffect(() => {
    // 1. Conexión Real-Time (SSE) - Para feedback inmediato (ideal para local)
    const eventSource = new EventSource('/api/timeline/stream')
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_notification' && data.recipientId === userId) {
          setUnreadCount(prev => prev + 1)
        }
      } catch {}
    }

    // 2. Polling de respaldo cada 10 segundos
    // Esto asegura que funcione en Vercel incluso si el SSE se desconecta o no enruta bien.
    const checkUnread = async () => {
      try {
        const res = await fetch('/api/notifications/count')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.count)
        }
      } catch (error) {}
    }

    // Comprobar inmediatamente también
    checkUnread()
    const interval = setInterval(checkUnread, 10000)

    return () => {
      eventSource.close()
      clearInterval(interval)
    }
  }, [userId])

  if (unreadCount === 0) return null

  return (
    <span className="absolute top-2 left-10 xl:left-9 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black animate-in zoom-in duration-200">
      {unreadCount}
    </span>
  )
}
