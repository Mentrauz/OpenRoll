import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Admin from '@/models/Admin';
import { verifyPassword } from '@/lib/auth/password-utils';

export async function POST() {
  try {
    const demoId = process.env.DEMO_USER_ID || '007';
    const demoPassword = process.env.DEMO_USER_PASSWORD || '1234@ABCD007';

    await connectDB();

    const user = await Admin.findOne({ id: demoId });

    if (!user) {
      return NextResponse.json({ error: 'Demo account not found' }, { status: 404 });
    }

    const isPasswordValid = await verifyPassword(demoPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid demo credentials' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      isLoggedIn: true,
      userRole: user.role || 'supervisor',
      timestamp: Date.now()
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Demo login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          role: user.role || 'supervisor'
        }
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'sessionUser',
      value: JSON.stringify(sessionData),
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { success: false, error: 'Demo login failed' },
      { status: 500 }
    );
  }
}
