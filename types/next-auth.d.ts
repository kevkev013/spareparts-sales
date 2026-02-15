import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      name: string
      email?: string | null
      role: string
      roleId: string
      permissions: Record<string, boolean>
    }
  }

  interface User {
    id: string
    username: string
    name: string
    email?: string | null
    role: string
    roleId: string
    permissions: Record<string, boolean>
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: string
    roleId: string
    permissions: Record<string, boolean>
  }
}
