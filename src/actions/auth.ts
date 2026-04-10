'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function register(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !username || !password) {
      return { error: 'Revisa los campos obligatorios.' }
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!passwordRegex.test(password)) {
      return { error: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.' }
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existingUser) {
      return { error: 'El email o nombre de usuario ya está en uso' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
      },
    })

    await createSession(user.id)
  } catch (error) {
    return { error: 'Ocurrió un error inesperado al registrarte.' }
  }
  
  // Fuera del try-catch para Next.js App Router
  redirect('/')
}

export async function login(prevState: any, formData: FormData) {
  try {
    const emailOrUsername = formData.get('emailOrUsername') as string
    const password = formData.get('password') as string

    if (!emailOrUsername || !password) {
      return { error: 'Llena todos los campos.' }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { error: 'Credenciales inválidas.' }
    }

    await createSession(user.id)
  } catch (error) {
    return { error: 'Ocurrió un error al procesar el inicio de sesión.' }
  }

  // Fuera del try-catch para evitar interceptar el redirect
  redirect('/')
}

export async function checkUsernameAvailability(username: string) {
  if (!username || username.length < 3) return null;
  const user = await prisma.user.findUnique({
    where: { username }
  });
  return !user; // true si está disponible, false si está ocupado
}

export async function checkEmailAvailability(email: string) {
  if (!email || !email.includes('@')) return null;
  const user = await prisma.user.findUnique({
    where: { email }
  });
  return !user;
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
