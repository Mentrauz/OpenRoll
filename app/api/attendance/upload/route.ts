import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';
import * as XLSX from 'xlsx-js-style';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const unit = formData.get('unit') as string;
    const month = formData.get('month') as string;
    const year = formData.get('year') as string;

    if (!file || !unit || !month || !year) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Get user session
    let userRole: string | null = null;
    let uploadedBy: string | null = null;
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('sessionUser');
      if (session?.value) {
        const parsed = JSON.parse(session.value);
        uploadedBy = parsed?.tmsId || null;
        userRole = parsed?.userRole || null;
      }
    } catch {}

    const client = await clientPromise;
    const employeesDb = client.db("Employees");
    
    // Debug: List all collections
    const collections = await employeesDb.listCollections().toArray();
    
    // Format unit name to match collection naming convention
    const formattedUnit = unit.toUpperCase().replace(/ /g, '_');
    
    const unitCollection = employeesDb.collection(formattedUnit);

    // Transform and verify each employee
    const transformedRecords = [];
    const invalidEmployees = [];

    for (const record of jsonData) {
      const empId = record['EMPCODE']?.toString() || '';
      
      if (!empId) continue;

      // Debug: Log the search attempt
      
      const employeeExists = await unitCollection.findOne({ empId });
      
      // Debug: Log the search result

      if (!employeeExists) {
        invalidEmployees.push(empId);
        continue;
      }

      transformedRecords.push({
        EMPID: empId,
        'P DAY': Number(record['P DAY']) || 0,
        ARREAR: Number(record.ARREAR) || 0,
        'ATT. AWARD': Number(record['ATT. AWARD']) || 0,
        'SPL. ALL': Number(record['SPL. ALL']) || 0,
        'FOOD ALL': Number(record['FOOD ALL']) || 0,
        'Prod.ALL': Number(record['Prod.ALL']) || 0,
        'NIGHT ALL': Number(record['NIGHT ALL']) || 0,
        'TRAN ALL': Number(record['TRAN ALL']) || 0,
        'ADV. DED': Number(record['ADV. DED']) || 0,
        'UNF.DED': Number(record['UNF.DED']) || 0,
        'TPA DED': Number(record['TPA DED']) || 0,
        'FOOD DED': Number(record['FOOD DED']) || 0,
        'PT': Number(record['PT']) || 0
      });
    }

    if (invalidEmployees.length > 0) {
      return NextResponse.json({
        success: false,
        invalidEmployees,
        error: 'Some employees not found in the selected unit'
      });
    }

    // If user is NOT admin, store in pending changes
    if (userRole !== 'admin') {
      await connectDB();

      const pendingChange = await PendingChange.create({
        changeType: 'bulk_upload',
        status: 'pending',
        requestedBy: uploadedBy,
        requestedByRole: userRole || 'data-operations',
        requestedAt: new Date(),
        changeData: {
          fileData: jsonData,
          transformedRecords,
          fileName: file.name,
          uploadType: 'attendance',
          unit,
          month,
          year
        },
        targetDatabase: 'Attendance',
        targetCollection: `attendance_${year}`,
        description: `Bulk attendance upload: ${transformedRecords.length} records for ${unit} - ${month}/${year}`
      });

      return NextResponse.json({
        success: true,
        message: 'Attendance upload submitted for admin approval',
        pending: true,
        changeId: pendingChange._id,
        recordCount: transformedRecords.length
      });
    }

    // Store attendance data in Attendance database
    const attendanceDb = client.db("Attendance");
    const collectionName = `attendance_${year}`;

    // Check if collection exists, if not create it
    const existingCollections = await attendanceDb.listCollections().toArray();
    const collectionExists = existingCollections.some(col => col.name === collectionName);

    if (!collectionExists) {
      await attendanceDb.createCollection(collectionName);
    }

    const collection = attendanceDb.collection(collectionName);
    const existingDoc = await collection.findOne({ month });

    if (!existingDoc) {
      await collection.insertOne({
        month,
        units: [{
          unit,
          records: transformedRecords
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      const unitExists = existingDoc.units?.some((u: any) => u.unit === unit);
      
      if (!unitExists) {
        await collection.updateOne(
          { month },
          {
            $push: {
              units: {
                unit,
                records: transformedRecords
              }
            },
            $set: { updatedAt: new Date() }
          }
        );
      } else {
        await collection.updateOne(
          {
            month,
            'units.unit': unit
          },
          {
            $set: {
              'units.$.records': transformedRecords,
              updatedAt: new Date()
            }
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      pending: false,
      message: 'Attendance records uploaded successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to upload attendance records'
    }, { status: 500 });
  }
} 





















