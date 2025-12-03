import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth/password-utils';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Users");

    const user = await db.collection('Admin').findOne({ id }, {
      projection: { password: 0 } // Exclude password from response
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("Users");

    // First try to find the user
    const user = await db.collection('Admin').findOne({ id: body.id });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is locked out
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.lockoutUntil).getTime() - new Date().getTime()) / 60000);
      return NextResponse.json({
        error: `Account is temporarily locked. Please try again in ${remainingTime} minutes.`
      }, { status: 429 });
    }

    // Reset attempts if lockout period has expired
    if (user.lockoutUntil && new Date(user.lockoutUntil) <= new Date()) {
      await db.collection('Admin').updateOne(
        { id: body.id },
        {
          $set: {
            passwordAttempts: 0,
            lockoutUntil: null
          }
        }
      );
    }

    // Increment attempt counter
    const updatedUser = await db.collection('Admin').findOneAndUpdate(
      { id: body.id },
      { $inc: { passwordAttempts: 1 } },
      { returnDocument: 'after' }
    );

    // Check if max attempts exceeded
    if (updatedUser.passwordAttempts >= MAX_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
      await db.collection('Admin').updateOne(
        { id: body.id },
        {
          $set: {
            lockoutUntil: lockoutUntil,
            passwordAttempts: 0
          }
        }
      );
      return NextResponse.json({
        error: 'Too many attempts. Account locked for 10 minutes.'
      }, { status: 429 });
    }

    // Prepare update data
    const updateData: any = {
      ...(body.fullName && { fullName: body.fullName }),
      ...(body.email && { email: body.email }),
      ...(body.phone && { phone: body.phone }),
      id: user.id,
      role: user.role,
      passwordAttempts: 0 // Reset attempts on successful update
    };

    // Hash new password if provided
    if (body.newPassword) {
      updateData.password = await hashPassword(body.newPassword);
    }

    // Update the user
    const result = await db.collection('Admin').updateOne(
      { id: body.id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No changes made' }, { status: 200 });
    }

    // Fetch the updated user data (excluding password)
    const finalUser = await db.collection('Admin').findOne(
      { id: body.id },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: finalUser
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}





















