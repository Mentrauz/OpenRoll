import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { hashPassword, validateCredentials } from '@/lib/auth/password-utils';
import { userSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  try {
    // Check if the requester is authenticated and has admin role
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sessionUser');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("Users");
    
    // Verify the requesting user is an admin or HR (HR cannot create admins)
    const requestingUser = await db.collection('Admin').findOne({ tmsId: sessionData.tmsId });
    if (!requestingUser || (requestingUser.role !== 'admin' && requestingUser.role !== 'hr')) {
      return NextResponse.json({ error: 'Admin or HR access required' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate the request body
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors.map(err => err.message)
        },
        { status: 400 }
      );
    }

    const { tmsId, password, name, role, email, department } = validation.data;
    if (requestingUser.role === 'hr' && role === 'admin') {
      return NextResponse.json({ error: 'HR cannot create admin users' }, { status: 403 });
    }

    // Additional password validation
    try {
      await validateCredentials(tmsId, password);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.collection('Admin').findOne({ tmsId });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = {
      tmsId,
      password: hashedPassword,
      fullName: name,
      role,
      email: email || null,
      department: department || null,
      createdAt: new Date(),
      createdBy: requestingUser.tmsId,
      passwordAttempts: 0,
      lockoutUntil: null
    };

    const result = await db.collection('Admin').insertOne(newUser);

    if (!result.insertedId) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Return success without password
    const userResponse = {
      tmsId: newUser.tmsId,
      fullName: newUser.fullName,
      role: newUser.role,
      email: newUser.email,
      department: newUser.department,
      createdAt: newUser.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
} 





















