import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/user';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected');
    
    const users = await User.find({});
    console.log('Users found:', users.length);
    
    return NextResponse.json({ 
      message: 'Database connected',
      userCount: users.length 
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 





















