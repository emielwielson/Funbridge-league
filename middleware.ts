import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/custom-auth';

export async function middleware(req: NextRequest) {
  // Skip middleware for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  
  // Get JWT token from cookies
  const token = req.cookies.get('auth_token')?.value;
  const hasValidSession = token ? verifyToken(token) !== null : false;

  // Protect routes that require authentication
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || 
                      req.nextUrl.pathname.startsWith('/register');
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isProtectedRoute = !isAuthRoute && req.nextUrl.pathname !== '/';

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !hasValidSession) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin routes require authentication (admin check done in ProtectedRoute component)
  if (isAdminRoute && !hasValidSession) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing auth routes with session, redirect to home
  if (isAuthRoute && hasValidSession) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|api|favicon.ico).*)',
  ],
};
