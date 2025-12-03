import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { empId } = await req.json();
    
    // Connect directly to the Employees database
    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db('Employees');

    // Log the empId we're searching for
    console.log('Searching for empId:', empId);

    // Get all collections in the Employees database
    const collections = await db.listCollections().toArray();
    
    // Search through each collection for the employee
    for (const collection of collections) {
      // Skip system collections
      if (collection.name.startsWith('system.')) {
        continue;
      }

      const existingEmployee = await db.collection(collection.name).findOne({
        empId: empId
      });

      if (existingEmployee) {
        console.log('Found employee in collection:', collection.name);
        await client.close();
        return NextResponse.json({
          exists: true,
          message: 'Employee ID exists'
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
      }
    }
    
    await client.close();
    return NextResponse.json({
      exists: false,
      message: 'Employee ID is available'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error checking employee ID:', error);
    return NextResponse.json(
      { error: 'Failed to check employee ID', exists: false },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
} 





















