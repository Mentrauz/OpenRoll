import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyPassword } from '@/lib/auth/password-utils';

export async function GET(request: Request) {
  try {
    // Get credentials from URL parameters
    const url = new URL(request.url);
    const tmsId = url.searchParams.get('tmsId');
    const password = url.searchParams.get('password');

    if (!tmsId || !password) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials'
      }, { status: 400 });
    }

    // Use connection pool
    const client = await clientPromise;
    const db = client.db('Users');
    
    // Find user by tmsId only
    const user = await db.collection('Admin').findOne({ tmsId: tmsId });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        tmsId: user.tmsId,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Authentication check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication check failed'
    }, { status: 500 });
  }
} 





















