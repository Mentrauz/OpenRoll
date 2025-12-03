import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sessionUser');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!sessionData.id) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("Users");

    // Get fresh user data from database
    const user = await db.collection('Admin').findOne({ id: sessionData.id });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update session with fresh role data
    const updatedSessionData = {
      ...sessionData,
      userRole: user.role,
      timestamp: Date.now()
    };

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Session refreshed',
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role
      }
    });

    // Update the session cookie
    response.cookies.set({
      name: 'sessionUser',
      value: JSON.stringify(updatedSessionData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}





















