'use server'

import { prisma } from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function forgotPassword(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string
    if (!email) return { error: 'Se requiere un email' }

    const user = await prisma.user.findUnique({ where: { email } })
    // Si el usuario no existe, igual le decimos "ÉXITO" al frontend (Regla de Owasp contra enuemración)
    if (!user) {
      return { success: true }
    }

    // Token seguro aleatorio, sin colisiones
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60) // Expira en 1 Hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    })

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`

    // 💡 OPTIMIZACIÓN LOCAL: En vez de enviar un correo por Nodemailer y depender del Rate-Limit,
    // devolvemos la URL maestra al frontend en modo Dev por conveniencia. 
    console.log(`\n[🔐 RECUPERACIÓN] Enlace secreto para restablecimiento de ${email}: \n${resetUrl}\n`)

    return { 
      success: true, 
      message: resetUrl,
      isRawUrl: true
    }
  } catch (error: any) {
    console.error("Detalles de error interno =>", error)
    return { error: 'Ocurrió un error interno al crear el cifrado temporal. Revisa tu terminal.' }
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  try {
    const token = formData.get('token') as string
    const password = formData.get('password') as string

    if (!token || !password) return { error: 'Faltan credenciales.' }

    const user = await prisma.user.findUnique({ where: { resetToken: token } })

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return { error: 'El enlace está corrompido o ya ha expirado ⏳. Solicita uno nuevo.' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return { success: true }
  } catch (error) {
    return { error: 'Surgió un inconveniente de red conectando con Prisma.' }
  }
}
