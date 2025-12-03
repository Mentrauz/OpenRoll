import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');
    const empId = searchParams.get('empId');

    // If unit is provided, search in specific unit (maintain existing behavior)
    if (unit) {
      const client = await clientPromise;
      const db = client.db('Employees');
      const formattedUnit = unit.trim().toUpperCase().replace(/\s+/g, '_');
      const collection = db.collection(formattedUnit);
      
      let query = {};
      if (empId) {
        query = { empId: empId };
      }
      
      const employees = await collection.find(query).toArray();
      return NextResponse.json(employees, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
    
    // If only empId is provided (for employee portal), search across all units
    if (empId) {
      const client = await clientPromise;
      const db = client.db('Employees');
      const collections = await db.listCollections().toArray();
      
      for (const collection of collections) {
        const unitCollection = db.collection(collection.name);
        const employee = await unitCollection.findOne({ empId: empId });
        
        if (employee) {
          return NextResponse.json([{
            ...employee,
            unitName: collection.name.replace(/_/g, ' ')
          }], {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          });
        }
      }
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }); // Employee not found in any unit
    }

    return NextResponse.json(
      { success: false, error: 'Unit or Employee ID is required' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error searching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search employees' },
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





















