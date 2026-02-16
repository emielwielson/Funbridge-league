import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime (required for bcryptjs and jsonwebtoken)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your .env file.' },
        { status: 500 }
      );
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      console.error('Missing or default JWT_SECRET');
      return NextResponse.json(
        { error: 'Server configuration error: JWT_SECRET is missing or not set. Please add it to your .env file.' },
        { status: 500 }
      );
    }

    // Try to import the auth module
    let registerCustom: any;
    try {
      const authModule = await import('@/lib/auth/custom-auth');
      registerCustom = authModule.registerCustom;
    } catch (importError: any) {
      console.error('Failed to import custom-auth module:', importError);
      console.error('Import error stack:', importError.stack);
      return NextResponse.json(
        { 
          error: `Failed to load authentication module: ${importError.message}`,
          details: process.env.NODE_ENV === 'development' ? importError.stack : undefined
        },
        { status: 500 }
      );
    }

    let body: { password: string; name: string; funbridge_username: string };
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Trim name and funbridge_username so we never store leading/trailing spaces
    body = {
      ...body,
      name: typeof body.name === 'string' ? body.name.trim() : body.name,
      funbridge_username: typeof body.funbridge_username === 'string' ? body.funbridge_username.trim() : body.funbridge_username,
    };
    
    console.log('Calling registerCustom with:', { name: body.name, hasPassword: !!body.password, hasFunbridgeUsername: !!body.funbridge_username });
    
    const result = await registerCustom(body);
    
    console.log('registerCustom result:', { hasUser: !!result.user, hasToken: !!result.token, hasError: !!result.error });

    if (result.error || !result.user || !result.token) {
      return NextResponse.json(
        { error: result.error?.message || 'Registration failed' },
        { status: 400 }
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
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Registration failed. Please check server logs.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

