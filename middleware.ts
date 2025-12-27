import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware runs in Edge runtime, so we need to verify token directly
// Using basic JWT decoding (signature verification would require Web Crypto API)
function verifyTokenInMiddleware(token: string): boolean {
  try {
    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Decode payload to check expiration
    try {
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        return false;
      }
      
      // Check if token has userId
      if (!payload.userId) {
        return false;
      }
      
      // Token structure is valid and not expired
      // Note: This doesn't verify the signature, but it's a basic check
      // The signature is verified server-side in API routes
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  // Skip middleware for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get JWT token from cookies
  const token = req.cookies.get('auth_token')?.value;
  const hasValidSession = token ? verifyTokenInMiddleware(token) : false;

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

  return NextResponse.next();
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
