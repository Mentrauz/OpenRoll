import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import Admin from '@/models/Admin';
import { verifyPassword } from '@/lib/auth/password-utils';

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json();

    // Connect to the database using Mongoose (reuses connection)
    await connectDB();

    // Find user using the Mongoose model
    // This ensures we use the schema which defines the index on id
    // Note: We assume the MONGODB_URI includes the correct database name (e.g. /Users)
    // or that the 'Admin' collection is in the default database.
    console.log(`Attempting login for id: ${id}`);
    const user = await Admin.findOne({ id });
    console.log(`User found: ${user ? 'Yes' : 'No'}`);

    if (!user) {
      console.log('User not found in DB');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // If login is successful - ENSURE userRole is included
    const sessionData = {
      id: id,
      isLoggedIn: true,
      userRole: user.role || 'supervisor', // Ensure role is set; no implicit admin default
      timestamp: Date.now()
    };

    // Create response with user data
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          role: user.role || 'supervisor'
        }
      },
      { status: 200 }
    );

    // Set the session cookie - NOT HttpOnly so it can be read by JavaScript
    response.cookies.set({
      name: 'sessionUser',
      value: JSON.stringify(sessionData),
      httpOnly: false, // Allow client checks/clearing
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Make this a browser session cookie so it does not persist beyond the session
      // by omitting maxAge and expires
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}





















