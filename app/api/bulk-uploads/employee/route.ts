import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx-js-style';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';
import { ObjectId } from 'mongodb';

const fieldMapping = {
  'Employee ID': 'empId',
  'Name': 'name',
  'Guardian\'s Name': 'guardianName',
  'Relation': 'relation',
  'DOB': 'dob',
  'DOJ': 'doj',
  'Bank A/C No.': 'bankAccount',
  'IFSC Code': 'ifscCode',
  'ESI No.': 'esicNumber',
  'ESIC No.': 'esicNumber',
  'ESI Number': 'esicNumber',
  'Basic': 'basic',
  'HRA': 'hra',
  'Conv.': 'conveyance',
  'Wash. ALL': 'washingAllowance',
  'Oth. All': 'otherAllowance',
  'Gross Rates': 'grossSalary',
  'Aadhar No.': 'aadharNumber',
  'Aadhar Number': 'aadharNumber',
  'Aadhar': 'aadharNumber',
  'UAN': 'uanNumber',
  'UAN No.': 'uanNumber',
  'UAN Number': 'uanNumber',
  'Unit Name': 'unitName',
  'Gender': 'gender',
  'Marital Status': 'maritalStatus',
  'LWF ID': 'lwfId',
  'Mobile Number': 'mobileNumber'
};

function formatCollectionName(unitName: string): string {
  return unitName.trim().toUpperCase().replace(/\s+/g, '_');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

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
        uploadedBy = parsed?.id || null;
        userRole = parsed?.userRole || null;
      }
    } catch { }

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
          fileName: file.name,
          uploadType: 'employee'
        },
        targetDatabase: 'Employees',
        description: `Bulk employee upload: ${jsonData.length} records from ${file.name}`
      });

      return NextResponse.json({
        success: true,
        message: 'Bulk upload submitted for admin approval',
        pending: true,
        changeId: pendingChange._id,
        recordCount: jsonData.length
      });
    }

    // If user IS admin, process directly
    const client = await clientPromise;
    const db = client.db('Employees');

    // Group data by unit name
    const dataByUnit = new Map<string, any[]>();

    // First pass: group records by unit
    jsonData.forEach((row: any) => {
      const unitName = row['Unit Name'] || 'DEFAULT';
      const collectionName = formatCollectionName(unitName);

      if (!dataByUnit.has(collectionName)) {
        dataByUnit.set(collectionName, []);
      }
      dataByUnit.get(collectionName)?.push(row);
    });

    let newRecords = 0;
    let updatedRecords = 0;
    let skippedRecords = 0;
    let unchangedRecords = 0;

    // Process each unit's data
    for (const [collectionName, unitData] of dataByUnit) {
      const collection = db.collection(collectionName);

      for (const row of unitData) {
        try {
          // Skip if required fields are missing
          if (!row['Employee ID'] || !row['Name']) {
            skippedRecords++;
            continue;
          }

          // Check if employee exists
          const existingEmployee = await collection.findOne({ empId: row['Employee ID']?.toString() });

          if (existingEmployee) {
            // Create new data object with only provided fields
            const updatedData: any = {};
            let hasChanges = false;

            // Compare each field and only include changed values
            Object.entries(fieldMapping).forEach(([excelField, dbField]) => {
              if (row[excelField] !== undefined) {
                const newValue = row[excelField]?.toString() || '';
                const existingValue = existingEmployee[dbField]?.toString() || '';

                if (newValue !== existingValue) {
                  updatedData[dbField] = newValue;
                  hasChanges = true;
                }
              }
            });

            if (hasChanges) {
              // Update only changed fields
              await collection.updateOne(
                { empId: row['Employee ID']?.toString() },
                {
                  $set: {
                    ...updatedData,
                    updatedAt: new Date().toISOString()
                  }
                }
              );
              updatedRecords++;
            } else {
              unchangedRecords++;
            }
          } else {
            // Insert new employee with all fields
            const employeeData = {
              _id: new ObjectId(),
              empId: row['Employee ID']?.toString(),
              name: row['Name'],
              guardianName: row["Guardian's Name"] || '',
              relation: row['Relation'] || '',
              dob: row['DOB'] || '',
              doj: row['DOJ'] || '',
              bankAccount: row['Bank A/C No.']?.toString() || '',
              ifscCode: row['IFSC Code'] || '',
              esicNumber: (row['ESI No.'] || row['ESIC No.'] || row['ESI Number'])?.toString() || '',
              basic: row['Basic']?.toString() || '0',
              hra: row['HRA']?.toString() || '0',
              conveyance: row['Conv.']?.toString() || '0',
              washingAllowance: row['Wash. ALL']?.toString() || '0',
              otherAllowance: row['Oth. All']?.toString() || '0',
              grossSalary: row['Gross Rates']?.toString() || '0',
              aadharNumber: (row['Aadhar No.'] || row['Aadhar Number'] || row['Aadhar'])?.toString() || '',
              uanNumber: (row['UAN'] || row['UAN No.'] || row['UAN Number'])?.toString() || '',
              unitName: row['Unit Name'] || '',
              gender: row['Gender']?.toLowerCase() || '',
              maritalStatus: row['Marital Status'] || '',
              lwfId: row['LWF ID']?.toString() || '',
              mobileNumber: row['Mobile Number']?.toString() || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            await collection.insertOne(employeeData);
            newRecords++;
          }

        } catch (error) {
          skippedRecords++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      pending: false,
      stats: {
        totalProcessed: jsonData.length,
        newRecords,
        updatedRecords,
        unchangedRecords,
        skippedRecords
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process file' },
      { status: 500 }
    );
  }
}





















