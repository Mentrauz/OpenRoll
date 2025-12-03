import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('Employees');
    
    // Get all collections (units)
    const collections = await db.listCollections().toArray();
    
    let totalEmployees = 0;
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      totalEmployees += count;
    }
    
    return NextResponse.json(
      {
        success: true,
        count: totalEmployees
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate', // No caching to ensure fresh data
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error counting employees:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to count employees' 
      },
      { status: 500 }
    );
  }
} 





















