import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/user';
import { verifyPassword } from '@/lib/auth/password-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    await connectDB();

    // Find user
    const user = await User.findOne({ tmsId: body.tmsId });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid ID or password' },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(body.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid ID or password' },
        { status: 401 }
      );
    }

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', user.tmsId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Make this a session cookie to avoid persistence across restarts
    });

    return NextResponse.json({
      success: true,
      user: {
        tmsId: user.tmsId,
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 





















