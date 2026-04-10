'use client'

import { useActionState } from 'react'
import { login } from '@/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Efecto de degradado sutil de fondo */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />
        
        <div className="relative">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Bienvenido a Flock</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">Ingresa a tu cuenta para conectarte</p>
          
          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Email o Usuario</label>
              <input 
                name="emailOrUsername" 
                type="text" 
                required 
                placeholder="usuario@ejemplo.com"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Contraseña</label>
              <input 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>

            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-2xl text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-sky-500 hover:bg-sky-400 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-full flex justify-center mt-6 disabled:opacity-50 shadow-lg shadow-sky-500/20"
            >
              {isPending ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-8 text-center text-zinc-400 text-sm">
            ¿No tienes una cuenta? <Link href="/register" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
