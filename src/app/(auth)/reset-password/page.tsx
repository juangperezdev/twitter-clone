'use client'
import { useActionState, Suspense, useState } from 'react'
import { resetPassword } from '@/actions/recovery'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetFormInputs() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [state, action, isPending] = useActionState(resetPassword, undefined)
  const [password, setPassword] = useState('')

  // Claves de Validación de diseño similar al Registro
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[\W_]/.test(password)
  const isPasswordValid = hasLength && hasUpper && hasNumber && hasSymbol

  if (!token) {
    return (
      <div className="text-white text-center mt-6">
        <p className="mb-4 text-zinc-400">Hubo un problema de autenticidad y el token de este enlace está ausente.</p>
        <Link href="/forgot-password" className="text-sky-500 border border-sky-500 hover:bg-sky-500/10 py-2 px-6 rounded-full font-bold transition-colors">Volver a intentar</Link>
      </div>
    )
  }

  if (state?.success) {
    return (
      <div className="text-center text-white slide-in-top mt-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
          <span className="text-2xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-green-500 mb-2">¡Todo asegurado!</h2>
        <p className="mb-8 text-zinc-400 text-sm">Tus nuevas credenciales han sido restablecidas y cristalizadas en la matriz con éxito.</p>
        <Link href="/login" className="bg-sky-500 text-white font-bold py-3.5 px-6 rounded-full shadow-lg shadow-sky-500/20 hover:bg-sky-600 block transition-all active:scale-[0.98]">
          Autenticarse ahora
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {/* Pasamos el Token de forma invisible a la Server Action */}
      <input type="hidden" name="token" value={token} />
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Escribe tu Nueva Contraseña</label>
        <input 
          name="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password" 
          required 
          pattern="(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}"
          placeholder="Tu clave fortificada"
          className={`w-full bg-zinc-950/50 border rounded-2xl px-4 py-3.5 text-white placeholder-zinc-700 transition-all focus:outline-none ${!isPasswordValid && password.length > 0 ? 'border-zinc-800' : isPasswordValid ? 'border-green-500 focus:ring-2 focus:ring-green-500/30' : 'border-zinc-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500'}`}
        />
        
        {/* Re-usamos la UI espectacular de los checks */}
        <div className="mt-4 flex flex-col gap-2 text-[12.5px] px-2 font-medium mb-2">
            <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasLength ? 'text-green-500' : 'text-zinc-600'}`}>
              {hasLength ? <span className="text-sm">✔️</span> : <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
              <span>Mínimo 8 caracteres</span>
            </div>
            <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasUpper ? 'text-green-500' : 'text-zinc-600'}`}>
              {hasUpper ? <span className="text-sm">✔️</span> : <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
              <span>Al menos 1 letra mayúscula</span>
            </div>
            <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasNumber ? 'text-green-500' : 'text-zinc-600'}`}>
              {hasNumber ? <span className="text-sm">✔️</span> : <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
              <span>Al menos 1 número</span>
            </div>
            <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasSymbol ? 'text-green-500' : 'text-zinc-600'}`}>
              {hasSymbol ? <span className="text-sm">✔️</span> : <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
              <span>Un símbolo especial (ej. @, $, #)</span>
            </div>
          </div>
      </div>
      
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm flex gap-2">
           <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           {state.error}
        </div>
      )}
      
      <button 
        disabled={isPending || !isPasswordValid} 
        type="submit" 
        className="w-full bg-white text-black font-bold py-3.5 mt-2 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
      >
        {isPending ? 'Modificando la bóveda...' : 'Confirmar Cambios'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
        {/* Glow Superior */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Nueva Contraseña</h1>
          <p className="text-zinc-400 text-sm mb-6 text-center">Asegúrate de no olvidarla esta vez 😉</p>
          
          <Suspense fallback={<div className="text-zinc-500 text-center animate-pulse py-8 font-medium">Leyendo código cuántico del enlace...</div>}>
            <ResetFormInputs />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
