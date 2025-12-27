import { NextRequest, NextResponse } from 'next/server';
import { loginCustom } from '@/lib/auth/custom-auth';
import type { LoginParams } from '@/lib/auth/custom-auth';

// Force Node.js runtime (required for bcryptjs and jsonwebtoken)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.' },
        { status: 500 }
      );
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      return NextResponse.json(
        { error: 'Server configuration error: JWT_SECRET is missing or not set.' },
        { status: 500 }
      );
    }

    const body: LoginParams = await request.json();
    
    const result = await loginCustom(body);

    if (result.error || !result.user || !result.token) {
      return NextResponse.json(
        { error: result.error?.message || 'Login failed' },
        { status: 401 }
      );
    }

    // Set JWT token in HTTP-only cookie
    const response = NextResponse.json({
      user: result.user,
    });

    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

