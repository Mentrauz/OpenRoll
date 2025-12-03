import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

interface AttendanceRecord {
  EMPID: string;
  'P DAY': number;
  ARREAR: number;
  'ATT. AWARD': number;
  'SPL. ALL': number;
  'FOOD ALL': number;
  'Prod.ALL': number;
  'NIGHT ALL': number;
  'TRAN ALL': number;
  'ADV. DED': number;
  'UNF.DED': number;
  'TPA DED': number;
  'FOOD DED': number;
}

export async function POST(
  request: Request,
  { params }: { params: { year: string; month: string } }
) {
  try {
    const { year, month } = params;
    const { unit, records } = await request.json();

    // Log the incoming data
    console.log('Incoming records:', records);

    if (!year || !month || !unit || !records) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Keep the exact structure from Excel, including EMPID
    const transformedRecords = records.map((record: any) => {
      console.log('Processing record:', record); // Log each record
      return {
        EMPID: record.EMPID,
        'P DAY': Number(record['P DAY']),
        ARREAR: Number(record.ARREAR),
        'ATT. AWARD': Number(record['ATT. AWARD']),
        'SPL. ALL': Number(record['SPL. ALL']),
        'FOOD ALL': Number(record['FOOD ALL']),
        'Prod.ALL': Number(record['Prod.ALL']),
        'NIGHT ALL': Number(record['NIGHT ALL']),
        'TRAN ALL': Number(record['TRAN ALL']),
        'ADV. DED': Number(record['ADV. DED']),
        'UNF.DED': Number(record['UNF.DED']),
        'TPA DED': Number(record['TPA DED']),
        'FOOD DED': Number(record['FOOD DED'])
      };
    });

    console.log('Transformed records:', transformedRecords); // Log transformed records

    // Check if document exists for this year/month/unit
    const existingDoc = await db.collection('attendance').findOne({
      year,
      'months.month': month,
      'months.units.unit': unit
    });

    let updateOperation;
    if (!existingDoc) {
      // Create new document
      updateOperation = {
        $set: {
          year,
          months: [{
            month,
            units: [{
              unit,
              records: transformedRecords
            }]
          }]
        },
        $setOnInsert: {
          createdAt: new Date()
        },
        $currentDate: { updatedAt: true }
      };
    } else {
      // Check if month exists
      const monthExists = existingDoc.months.some((m: any) => m.month === month);
      
      if (!monthExists) {
        // Add new month
        updateOperation = {
          $push: {
            months: {
              month,
              units: [{
                unit,
                records: transformedRecords
              }]
            }
          },
          $currentDate: { updatedAt: true }
        };
      } else {
        // Update existing month and unit
        updateOperation = {
          $set: {
            'months.$[month].units.$[unit].records': transformedRecords
          },
          $currentDate: { updatedAt: true }
        };
      }
    }

    // Perform the update
    const result = await db.collection('attendance').updateOne(
      { year },
      updateOperation,
      {
        upsert: true,
        arrayFilters: [
          { 'month.month': month },
          { 'unit.unit': unit }
        ]
      }
    );

    // Log the result and verify the update
    console.log('Update result:', result);
    
    // Fetch and log the updated document
    const updatedDoc = await db.collection('attendance').findOne({
      year,
      'months.month': month,
      'months.units.unit': unit
    });
    console.log('Updated document:', updatedDoc);

    return NextResponse.json({
      success: true,
      message: 'Attendance records updated successfully'
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update attendance records'
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { year: string; month: string } }
) {
  try {
    const { year, month } = params;
    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');

    if (!year || !month || !unit) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Find the document and extract the specific unit's records
    const result = await db.collection('attendance').findOne(
      {
        year,
        'months.month': month,
        'months.units.unit': unit
      },
      {
        projection: {
          'months.$': 1
        }
      }
    );

    if (!result || !result.months || !result.months[0]) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Find the specific unit in the month's units array
    const monthData = result.months[0];
    const unitData = monthData.units.find((u: any) => u.unit === unit);

    if (!unitData || !unitData.records) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Return the records directly as they are already in the correct format
    return NextResponse.json({
      success: true,
      data: unitData.records
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch attendance records'
    }, { status: 500 });
  }
} 