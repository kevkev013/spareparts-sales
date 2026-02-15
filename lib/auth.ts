import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginLimiter } from '@/lib/rate-limit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const ip = 'login:' + (credentials?.username || 'unknown')
        const { success } = loginLimiter(ip)
        if (!success) {
          throw new Error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.')
        }

        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username dan password harus diisi')
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { role: true },
        })

        if (!user || !user.isActive) {
          throw new Error('Username atau password salah')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error('Username atau password salah')
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          username: user.username,
          name: user.fullName,
          email: user.email,
          role: user.role.name,
          roleId: user.roleId,
          permissions: user.role.permissions as Record<string, boolean>,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.roleId = user.roleId
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      session.user.role = token.role as string
      session.user.roleId = token.roleId as string
      session.user.permissions = token.permissions as Record<string, boolean>
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
