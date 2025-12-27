import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, verifyToken } from '@/lib/auth/custom-auth';

// Force Node.js runtime (required for jsonwebtoken)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const result = await getCurrentUserFromToken(token);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({ user: result.user });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

