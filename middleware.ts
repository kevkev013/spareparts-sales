import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/master/:path*',
    '/sales/:path*',
    '/payments/:path*',
    '/returns/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/api/((?!auth).)*',
  ],
}
