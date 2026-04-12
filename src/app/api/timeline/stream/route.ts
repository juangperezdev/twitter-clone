import { eventBus } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Enviar heartbeat cada 30s para mantener la conexión viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Suscribirse al bus de eventos
      const unsubscribe = eventBus.subscribe((event) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch {
          // Stream cerrado
          unsubscribe()
          clearInterval(heartbeat)
        }
      })

      // Cleanup al cerrar conexión
      const originalCancel = controller.close.bind(controller)
      // Se limpia automáticamente cuando el cliente se desconecta
    },
    cancel() {
      // Stream cerrado por el cliente
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
