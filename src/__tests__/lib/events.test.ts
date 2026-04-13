import { describe, it, expect, vi } from 'vitest'
import { eventBus } from '@/lib/events'

describe('AppEventBus', () => {
  it('should subscribe and emit events', () => {
    const listener = vi.fn()
    const unsubscribe = eventBus.subscribe(listener)
    
    const event = { type: 'new_tweet', data: { id: '1' } } as any
    eventBus.emit(event)
    
    expect(listener).toHaveBeenCalledWith(event)
    unsubscribe()
  })

  it('should handle multiple subscribers', () => {
    const l1 = vi.fn()
    const l2 = vi.fn()
    eventBus.subscribe(l1)
    eventBus.subscribe(l2)
    
    eventBus.emit({ type: 'new_tweet', data: {} } as any)
    
    expect(l1).toHaveBeenCalled()
    expect(l2).toHaveBeenCalled()
  })

  it('should unsubscribe correctly', () => {
    const listener = vi.fn()
    const unsubscribe = eventBus.subscribe(listener)
    
    unsubscribe()
    eventBus.emit({ type: 'new_tweet', data: {} } as any)
    
    expect(listener).not.toHaveBeenCalled()
  })

  it('should handle errors in listeners gracefully', () => {
    const faultyListener = () => { throw new Error('Boom') }
    const goodListener = vi.fn()
    
    eventBus.subscribe(faultyListener)
    eventBus.subscribe(goodListener)
    
    // Should not throw
    eventBus.emit({ type: 'new_tweet', data: {} } as any)
    
    expect(goodListener).toHaveBeenCalled()
  })

  it('should return connection count', () => {
    // Note: since it's a singleton, we need to be careful with other tests
    // but in Vitest with clear isolation or just checking if it increases
    const initial = eventBus.connectionCount
    const unsub = eventBus.subscribe(() => {})
    expect(eventBus.connectionCount).toBe(initial + 1)
    unsub()
    expect(eventBus.connectionCount).toBe(initial)
  })
})
