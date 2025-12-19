import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only apply to API routes under /api/apps/
  if (pathname.startsWith('/api/apps/')) {
    try {
      // Get the JWT token from NextAuth
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      })

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Clone the request headers
      const requestHeaders = new Headers(request.headers)

      // Add authentication headers for API routes
      requestHeaders.set('x-user-id', token.sub || '')
      requestHeaders.set('x-tenant-id', (token.tenantId as string) || 'tenant-demo-001')
      requestHeaders.set('x-user-permissions', JSON.stringify(token.permissions || ['*']))

      // Create a new response with the modified headers
      const response = NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })

      return response
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/apps/:path*'
}
