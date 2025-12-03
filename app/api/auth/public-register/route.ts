import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword, validateCredentials } from '@/lib/auth/password-utils';
import { z } from 'zod';

// Public registration schema
const publicRegisterSchema = z.object({
  tmsId: z.string().min(1, 'ID is required'),
  name: z.string().trim().min(1, 'Name is required'),
  password: z.string().min(1, 'Password is required'),
  email: z.string().email('Valid email is required'),
  department: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validation = publicRegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors.map(err => err.message)
        },
        { status: 400 }
      );
    }

    const { tmsId, password, name, email, department } = validation.data;

    // Additional password validation
    try {
      await validateCredentials(tmsId, password);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Users");

    // Check if user already exists
    const existingUser = await db.collection('Admin').findOne({ tmsId });
    if (existingUser) {
      return NextResponse.json({ error: 'User ID already exists' }, { status: 409 });
    }

    // Check if email already exists
    const existingEmail = await db.collection('Admin').findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create new user with default HR role
    const newUser = {
      tmsId,
      password: hashedPassword,
      fullName: name,
      role: 'hr', // Default role for public registration
      email: email,
      department: department || null,
      createdAt: new Date(),
      createdBy: 'self-registered',
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
      message: 'Registration successful',
      user: userResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}





















