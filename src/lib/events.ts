// Event bus simple en memoria para coordinar SSE
// En producción se usaría Redis Pub/Sub para distribuir entre instancias

type EventType = 'new_tweet' | 'new_notification'

interface AppEvent {
  type: EventType
  data: any
  recipientId?: string // Opcional, para notificaciones privadas
}

type Listener = (event: AppEvent) => void

class AppEventBus {
  private listeners: Set<Listener> = new Set()

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  emit(event: AppEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch {
        // Ignorar listeners desconectados
      }
    })
  }

  get connectionCount() {
    return this.listeners.size
  }
}

// Singleton global (persiste entre hot reloads en dev)
const globalForBus = globalThis as unknown as { eventBus: AppEventBus | undefined }
export const eventBus = globalForBus.eventBus ?? new AppEventBus()
if (process.env.NODE_ENV !== 'production') globalForBus.eventBus = eventBus
