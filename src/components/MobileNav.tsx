'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationListener } from './NotificationListener'

export function MobileNav({ userId, unreadCount }: { userId?: string, unreadCount?: number }) {
  const pathname = usePathname()
  
  return (
    <>
      {/* Floating Action Button for compose */}
      <div className="fixed bottom-[74px] right-4 sm:hidden z-50">
        <Link href="/compose" className="w-[56px] h-[56px] bg-sky-500 hover:bg-sky-600 rounded-full flex items-center justify-center transition shadow-lg shadow-sky-500/20 text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </Link>
      </div>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex justify-around items-center h-[60px] pb-safe sm:hidden z-50">
        <Link href="/" className={`p-3 rounded-full transition ${pathname === '/' ? 'text-white' : 'text-zinc-500'}`}>
          <svg className="w-[26px] h-[26px]" fill={pathname === '/' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname === '/' ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </Link>
        <Link href="/search" className={`p-3 rounded-full transition ${pathname === '/search' ? 'text-white' : 'text-zinc-500'}`}>
          <svg className="w-[26px] h-[26px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </Link>
        <Link href="/notifications" className={`relative p-3 rounded-full transition ${pathname === '/notifications' ? 'text-white' : 'text-zinc-500'}`}>
          <svg className="w-[26px] h-[26px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {userId && unreadCount !== undefined && <NotificationListener userId={userId} initialCount={unreadCount} mobile={true} />}
        </Link>
      </nav>
    </>
  )
}

