// Event bus simple en memoria para coordinar SSE
// En producción se usaría Redis Pub/Sub para distribuir entre instancias

type Listener = (data: any) => void

class TweetEventBus {
  private listeners: Set<Listener> = new Set()

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  emit(event: { type: string; tweet: any }) {
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
const globalForBus = globalThis as unknown as { tweetBus: TweetEventBus | undefined }
export const tweetBus = globalForBus.tweetBus ?? new TweetEventBus()
if (process.env.NODE_ENV !== 'production') globalForBus.tweetBus = tweetBus
