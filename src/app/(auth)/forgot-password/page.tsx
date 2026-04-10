'use client'
import { useActionState } from 'react'
import { forgotPassword } from '@/actions/recovery'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPassword, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.05)]">
        
        {/* Adorno superior sutil */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />
        
        <div className="relative">
          <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Recupera tu cuenta</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">Te remitiremos un enlace de seguridad privado mediante tu bandeja de correos.</p>

          {state?.success ? (
            <div className="text-center slide-in-top">
              <div className="w-20 h-20 bg-green-500/10 rounded-full mx-auto flex items-center justify-center mb-4">
                <span className="text-3xl">📭</span>
              </div>
              <h2 className="text-2xl font-bold text-green-500 mb-2">¡Correo enviado!</h2>
              <p className="text-zinc-400 mb-6 text-sm">Por favor, revisa tu bandeja de entrada o la carpeta de elementos no deseados (spam).</p>
              
              {/* Botón de acceso exclusivo y mágico en modo desarrollo para no necesitar entrar al Mail */}
              {state.message && (
                <div className="mb-6 space-y-2">
                  <p className="text-xs text-sky-400 font-bold uppercase tracking-wider">Link Simulado (Dev Mode)</p>
                  <a href={state.message} className="block p-4 border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 rounded-2xl text-sky-400 text-sm active:scale-[0.98] transition-all font-medium break-all">
                    {state.isRawUrl ? `Hacer click para entrar a link secreto: ${state.message}` : '→ CLIC AQUÍ PARA ABRIR SIMULADOR EMAIL ←'}
                  </a>
                </div>
              )}
              
              <Link href="/login" className="bg-white text-black font-bold py-3.5 px-6 rounded-full w-full block hover:bg-zinc-200 transition-colors shadow-lg">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Ingresa tu email registrado en Flock</label>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="tucorreo@dominio.com"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium placeholder-zinc-700"
                />
              </div>
              
              {state?.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mt-2">
                  {state.error}
                </div>
              )}
              
              <button 
                disabled={isPending} 
                type="submit" 
                className="w-full bg-sky-500 text-white font-bold py-3.5 rounded-full hover:bg-sky-400 mt-6 disabled:opacity-50 disabled:cursor-wait transition-colors shadow-lg shadow-sky-500/20"
              >
                {isPending ? 'Estableciendo cifrado y enviando...' : 'Enviar enlace maestro'}
              </button>
              
              <div className="mt-6 text-center">
                 <Link href="/login" className="text-zinc-500 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white pb-0.5">
                   Cancelar operación y volver
                 </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
