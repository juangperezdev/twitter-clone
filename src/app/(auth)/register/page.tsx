'use client'

import { useActionState, useState, useEffect } from 'react'
import { register, checkUsernameAvailability, checkEmailAvailability } from '@/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, undefined)
  
  // States para el Usuario
  const [username, setUsername] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  
  // States para el Email
  const [email, setEmail] = useState('')
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  // States para la Contraseña
  const [password, setPassword] = useState('')
  
  // Constantes dinámicas que evalúan los Checks de la contraseña en tiempo real
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[\W_]/.test(password) // Coincide con cualquier caracter no alfanumérico o subguión
  const isPasswordValid = hasLength && hasUpper && hasNumber && hasSymbol

  // Validación debounce de Usuario en Prisma
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsChecking(true)
      const available = await checkUsernameAvailability(username.toLowerCase())
      setIsAvailable(available)
      setIsChecking(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  // Validación debounce de Email en Prisma
  useEffect(() => {
    if (!email.includes('@')) {
      setIsEmailAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true)
      const available = await checkEmailAvailability(email.toLowerCase())
      setIsEmailAvailable(available)
      setIsCheckingEmail(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [email])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 py-12">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Efecto de degradado */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
              <span className="text-black font-bold text-2xl">F</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Únete a Flock</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">Crea tu cuenta en la red de la bandada</p>
          
          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Nombre Completo</label>
              <input 
                name="name" 
                type="text" 
                required 
                placeholder="Juan Pérez"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Ingresa tu Email</label>
              <div className="relative">
                <input 
                  name="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  type="email" 
                  required 
                  placeholder="juan@ejemplo.com"
                  className={`w-full bg-zinc-950/50 border rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all ${isEmailAvailable === false ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : isEmailAvailable === true ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/30' : 'border-zinc-800 focus:border-white/50'}`}
                />
                {isCheckingEmail && <span className="absolute right-4 top-4 text-[11px] text-zinc-400 font-medium">Verificando...</span>}
                {isEmailAvailable === true && !isCheckingEmail && <span className="absolute right-4 top-3.5 text-[12px] text-green-500 font-bold">✅ Libre</span>}
                {isEmailAvailable === false && !isCheckingEmail && <span className="absolute right-4 top-3.5 text-[12px] text-red-500 font-bold">❌ Ocupado</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Elige un Nombre de Usuario</label>
              <div className="relative">
                <input 
                  name="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  type="text" 
                  required 
                  placeholder="juanp"
                  className={`w-full bg-zinc-950/50 border rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all ${isAvailable === false ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : isAvailable === true ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/30' : 'border-zinc-800 focus:border-white/50'}`}
                />
                {isChecking && <span className="absolute right-4 top-4 text-[11px] text-zinc-400 font-medium">Verificando...</span>}
                {isAvailable === true && !isChecking && <span className="absolute right-4 top-3.5 text-[12px] text-green-500 font-bold">✅ Libre</span>}
                {isAvailable === false && !isChecking && <span className="absolute right-4 top-3.5 text-[12px] text-red-500 font-bold">❌ Ocupado</span>}
              </div>
            </div>
            
            {/* Validación visual e interactiva de contraseñas */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Tú Contraseña</label>
              <input 
                name="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength={8}
                pattern="(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}"
                title="Mínimo 8 caracteres, una mayúscula, un número y un símbolo"
                placeholder="••••••••"
                className={`w-full bg-zinc-950/50 border rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all ${
                  password.length > 0 && !isPasswordValid 
                    ? 'border-zinc-800' 
                    : isPasswordValid 
                      ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/30' 
                      : 'border-zinc-800 focus:border-white/50'
                }`}
              />
              
              <div className="mt-4 flex flex-col gap-2 text-[12.5px] px-2 font-medium">
                <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasLength ? 'text-green-500' : 'text-zinc-600'}`}>
                  {hasLength 
                    ? <svg className="w-4 h-4 shrink-0 shadow-sm shadow-green-500/40 rounded-full" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                    : <div className="w-4 h-4 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
                  <span>Mínimo 8 caracteres</span>
                </div>
                
                <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasUpper ? 'text-green-500' : 'text-zinc-600'}`}>
                  {hasUpper 
                    ? <svg className="w-4 h-4 shrink-0 shadow-sm shadow-green-500/40 rounded-full" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                    : <div className="w-4 h-4 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
                  <span>Al menos 1 letra mayúscula</span>
                </div>
                
                <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasNumber ? 'text-green-500' : 'text-zinc-600'}`}>
                  {hasNumber 
                    ? <svg className="w-4 h-4 shrink-0 shadow-sm shadow-green-500/40 rounded-full" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                    : <div className="w-4 h-4 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
                  <span>Al menos 1 número</span>
                </div>
                
                <div className={`flex items-center gap-2.5 transition-colors duration-300 ${hasSymbol ? 'text-green-500' : 'text-zinc-600'}`}>
                  {hasSymbol 
                    ? <svg className="w-4 h-4 shrink-0 shadow-sm shadow-green-500/40 rounded-full" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                    : <div className="w-4 h-4 rounded-full border-[1.5px] border-zinc-700 shrink-0"></div>}
                  <span>Un símbolo especial (ej. @, $, #)</span>
                </div>
              </div>
            </div>

            {/* Panel dinámico inteligente cuando los datos están ocupados */}
            {(isAvailable === false || isEmailAvailable === false) && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 p-4 rounded-2xl text-sm flex flex-col gap-2 mt-4 transition-all">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">Parece que ya tienes una cuenta vinculada a esta información.</span>
                </div>
                <Link href="/login" className="font-bold underline hover:text-yellow-400 self-start ml-7 transition-colors">
                  ¿Deseas recuperar tu contraseña y entrar ahora?
                </Link>
              </div>
            )}

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
              disabled={isPending || isAvailable === false || isEmailAvailable === false || !isPasswordValid}
              className="w-full bg-white hover:bg-zinc-200 active:scale-[0.98] transition-all text-black font-bold py-3.5 rounded-full flex justify-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
            >
              {isPending ? 'Procesando validaciones...' : 'Crear mi Cuenta'}
            </button>
          </form>

          <p className="mt-8 text-center text-zinc-400 text-sm">
            ¿Ya tienes una cuenta? <Link href="/login" className="text-white hover:underline font-medium transition-colors">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
