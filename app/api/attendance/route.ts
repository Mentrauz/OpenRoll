import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');



    if (!employeeId || !month || !year) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID, month, and year are required'
      }, {
        status: 400,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    const { db } = await connectToDatabase();

    // Query the attendance collection for monthly summary
    const attendance = await db.collection('attendance').findOne({
      year: year,
      'months.month': month,
      'months.units.unit': 'YOUR COMPANY NAME',
      'months.units.records.EMPID': employeeId
    });

    if (!attendance) {
      return NextResponse.json({
        success: true,
        attendance: {
          presentDays: 0
        }
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    const monthlyDays = new Date(parseInt(year), parseInt(month), 0).getDate();

    // Extract and validate the employee's record
    const monthData = attendance.months.find(m => m.month === month);
    const unitData = monthData.units.find(u => u.unit === 'YOUR COMPANY NAME');
    const employeeRecord = unitData.records.find(r => r.EMPID === employeeId);

    // Ensure present days don't exceed monthly days
    const presentDays = Math.min(
      Number(employeeRecord['P DAY']) || 0,
      monthlyDays
    );



    return NextResponse.json({
      success: true,
      attendance: {
        presentDays,  // Using the validated present days
        arrear: employeeRecord.ARREAR || 0,
        attAward: employeeRecord['ATT. AWARD'] || 0,
        splAll: employeeRecord['SPL. ALL'] || 0,
        foodAll: employeeRecord['FOOD ALL'] || 0,
        prodAll: employeeRecord['Prod.ALL'] || 0,
        nightAll: employeeRecord['NIGHT ALL'] || 0,
        tranAll: employeeRecord['TRAN ALL'] || 0,
        advDed: employeeRecord['ADV. DED'] || 0,
        unfDed: employeeRecord['UNF.DED'] || 0,
        tpaDed: employeeRecord['TPA DED'] || 0,
        foodDed: employeeRecord['FOOD DED'] || 0
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch attendance'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, location, clientDate, clientTimestamp } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'No ID provided'
      }, {
        status: 400,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    const currentDate = new Date();
    const providedDate = typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)
      ? clientDate
      : null;

    const dateForRecord = providedDate || currentDate.toISOString().split('T')[0];

    const [yearStr, monthStr] = dateForRecord.split('-');
    const month = Number(monthStr);
    const year = Number(yearStr);
    const collectionName = `${getMonthName(month)}_${year}`;

    const client = await clientPromise;
    // Explicitly connect to Employeeattendance database
    const db = client.db('Employeeattendance');

    const dateString = dateForRecord;
    const timeInValue = typeof clientTimestamp === 'string' && clientTimestamp
      ? clientTimestamp
      : currentDate.toISOString();

    // Prepare attendance record with location
    const attendanceRecord = {
      id: id,
      date: dateString,
      timeIn: timeInValue,
      status: 'present',
      createdAt: currentDate.toISOString(),
      location: location ? {  // Only add location if provided
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      } : undefined
    };

    // Upsert to avoid duplicates in concurrent/rapid submissions
    const result = await db.collection(collectionName).updateOne(
      { id, date: dateString },
      { $setOnInsert: attendanceRecord },
      { upsert: true }
    );

    if (result.upsertedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Already marked attendance for today'
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendanceRecord
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to mark attendance'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}

function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1];
}





















