import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!unit || !month || !year) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("TMSDB");
    
    // First, get attendance data from attendance_2024 collection
    const attendanceCollection = db.collection('attendance_2024');
    
    // Find the attendance document for the specified month
    const attendance = await attendanceCollection.findOne({
      month: month,
      "units.name": unit  // Look for unit within the units array
    });

    if (!attendance) {
      return NextResponse.json({
        success: false,
        error: 'No attendance records found'
      }, { status: 404 });
    }

    // Find the specific unit's data within the units array
    const unitData = attendance.units.find((u: any) => u.name === unit);
    if (!unitData || !unitData.employees) {
      return NextResponse.json({
        success: false,
        error: 'No employee records found for this unit'
      }, { status: 404 });
    }

    // Process each employee's data
    const esicData = [];
    for (const emp of unitData.employees) {
      // Only include employees that have an ESIC number
      if (emp.esicNumber) {
        esicData.push({
          esicNumber: emp.esicNumber,
          name: emp.name,
          payDays: emp['P DAY'] || 0,
          grossEarnings: emp.grossEarnings || 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      employees: esicData
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error fetching ESIC data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ESIC data'
    }, { status: 500 });
  }
} 





















