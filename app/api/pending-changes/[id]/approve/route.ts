import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';
import clientPromise from '@/lib/mongodb';

/**
 * POST - Approve a pending change and apply it to the actual database
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('sessionUser');
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(session.value);
    
    // Only admins can approve changes
    if (sessionData.userRole !== 'admin') {
      return NextResponse.json({ 
        error: 'Only administrators can approve changes' 
      }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { comments } = body;

    // Find the pending change
    const pendingChange = await PendingChange.findById(params.id);

    if (!pendingChange) {
      return NextResponse.json({ 
        error: 'Pending change not found' 
      }, { status: 404 });
    }

    if (pendingChange.status !== 'pending') {
      return NextResponse.json({ 
        error: 'This change has already been processed' 
      }, { status: 400 });
    }

    // Apply the change based on type
    const client = await clientPromise;
    let result;

    switch (pendingChange.changeType) {
      case 'employee_registration':
        result = await applyEmployeeRegistration(client, pendingChange);
        break;
      
      case 'employee_update':
        result = await applyEmployeeUpdate(client, pendingChange);
        break;
      
      case 'unit_registration':
      case 'unit_update':
        result = await applyUnitChange(client, pendingChange);
        break;
      
      case 'attendance_mark':
        result = await applyAttendanceMark(client, pendingChange);
        break;
      
      case 'bulk_upload':
        result = await applyBulkUpload(client, pendingChange);
        break;
      
      default:
        return NextResponse.json({ 
          error: 'Unknown change type' 
        }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to apply change' 
      }, { status: 500 });
    }

    // Mark as approved
    pendingChange.status = 'approved';
    pendingChange.reviewedBy = sessionData.tmsId;
    pendingChange.reviewedAt = new Date();
    pendingChange.reviewComments = comments;
    await pendingChange.save();

    return NextResponse.json({
      success: true,
      message: 'Change approved and applied successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to approve change'
    }, { status: 500 });
  }
}

// Helper function to apply employee registration
async function applyEmployeeRegistration(client: any, pendingChange: any) {
  try {
    const { unitName, ...employeeDetails } = pendingChange.changeData;
    const db = client.db('Employees');
    
    const formattedUnit = unitName
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/\.\s+/, '._')
      .replace(/\((.*?)\)/, '($1)');
    
    const collection = db.collection(formattedUnit);
    
    const now = new Date();
    await collection.insertOne({
      ...employeeDetails,
      unitName,
      createdAt: now,
      updatedAt: now,
      createdBy: pendingChange.requestedBy,
      updatedBy: pendingChange.requestedBy,
      approvedBy: pendingChange.reviewedBy,
      approvedAt: now
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to register employee' };
  }
}

// Helper function to apply employee update
async function applyEmployeeUpdate(client: any, pendingChange: any) {
  try {
    const db = client.db('Employees');
    const collection = db.collection(pendingChange.targetCollection);
    
    const now = new Date();
    const updateData = {
      ...pendingChange.changeData,
      updatedAt: now,
      updatedBy: pendingChange.requestedBy,
      approvedBy: pendingChange.reviewedBy,
      approvedAt: now
    };

    const { ObjectId } = require('mongodb');
    await collection.updateOne(
      { _id: new ObjectId(pendingChange.targetDocumentId) },
      { $set: updateData }
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update employee' };
  }
}

// Helper function to apply unit changes
async function applyUnitChange(client: any, pendingChange: any) {
  try {
    const unitsDb = client.db('Units');
    const data = pendingChange.changeData;
    
    // Format the unit name consistently - only use for new units
    const sanitizedUnitName = data.unitName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    // Determine if this is an update or new registration
    // Use targetDocumentId if available, then data._id, or fall back to sanitized name for new units
    const unitId = pendingChange.targetDocumentId || data._id || sanitizedUnitName;
    
    const formattedData = {
      _id: unitId,
      type: "unit_details",
      ...data,
      createdBy: pendingChange.requestedBy,
      approvedBy: pendingChange.reviewedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    };

    const unitsListCollection = unitsDb.collection('UnitsList');
    const existingUnit = await unitsListCollection.findOne({ _id: unitId });

    if (existingUnit) {
      await unitsListCollection.updateOne(
        { _id: unitId },
        { $set: { ...formattedData, createdAt: existingUnit.createdAt } }
      );
    } else {
      formattedData.createdAt = formattedData.updatedAt;
      await unitsListCollection.insertOne(formattedData);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to apply unit change' };
  }
}

// Helper function to apply attendance mark
async function applyAttendanceMark(client: any, pendingChange: any) {
  try {
    const db = client.db('Employeeattendance');
    const { tmsId, date, timeIn, status, monthYear } = pendingChange.changeData;
    
    await db.collection(monthYear).insertOne({
      tmsId,
      date,
      timeIn,
      status,
      markedBy: pendingChange.requestedBy,
      approvedBy: pendingChange.reviewedBy,
      approvedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to mark attendance' };
  }
}

// Helper function to apply bulk upload
async function applyBulkUpload(client: any, pendingChange: any) {
  try {
    const { uploadType, fileData, transformedRecords, unit, month, year } = pendingChange.changeData;
    const { ObjectId } = require('mongodb');

    if (uploadType === 'employee') {
      // Process employee bulk upload
      const db = client.db('Employees');
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

      const formatCollectionName = (unitName: string) => unitName.trim().toUpperCase().replace(/\s+/g, '_');
      const dataByUnit = new Map();
      
      fileData.forEach((row: any) => {
        const unitName = row['Unit Name'] || 'DEFAULT';
        const collectionName = formatCollectionName(unitName);
        if (!dataByUnit.has(collectionName)) {
          dataByUnit.set(collectionName, []);
        }
        dataByUnit.get(collectionName)?.push(row);
      });

      for (const [collectionName, unitData] of dataByUnit) {
        const collection = db.collection(collectionName);

        for (const row of unitData) {
          if (!row['Employee ID'] || !row['Name']) continue;

          const existingEmployee = await collection.findOne({ empId: row['Employee ID']?.toString() });

          if (existingEmployee) {
            const updatedData: any = {};
            Object.entries(fieldMapping).forEach(([excelField, dbField]) => {
              if (row[excelField] !== undefined) {
                const newValue = row[excelField]?.toString() || '';
                const existingValue = existingEmployee[dbField]?.toString() || '';
                if (newValue !== existingValue) {
                  updatedData[dbField] = newValue;
                }
              }
            });

            if (Object.keys(updatedData).length > 0) {
              await collection.updateOne(
                { empId: row['Employee ID']?.toString() },
                { $set: { ...updatedData, updatedAt: new Date().toISOString(), approvedBy: pendingChange.reviewedBy, approvedAt: new Date() } }
              );
            }
          } else {
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
              updatedAt: new Date().toISOString(),
              createdBy: pendingChange.requestedBy,
              approvedBy: pendingChange.reviewedBy,
              approvedAt: new Date()
            };

            await collection.insertOne(employeeData);
          }
        }
      }

      return { success: true };
    } else if (uploadType === 'attendance') {
      // Process attendance bulk upload
      const attendanceDb = client.db("Attendance");
      const collectionName = `attendance_${year}`;
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
          updatedAt: new Date(),
          uploadedBy: pendingChange.requestedBy,
          approvedBy: pendingChange.reviewedBy,
          approvedAt: new Date()
        });
      } else {
        const unitExists = existingDoc.units?.some((u: any) => u.unit === unit);
        
        if (!unitExists) {
          await collection.updateOne(
            { month },
            {
              $push: { units: { unit, records: transformedRecords } },
              $set: { updatedAt: new Date(), approvedBy: pendingChange.reviewedBy, approvedAt: new Date() }
            }
          );
        } else {
          await collection.updateOne(
            { month, 'units.unit': unit },
            {
              $set: {
                'units.$.records': transformedRecords,
                updatedAt: new Date(),
                approvedBy: pendingChange.reviewedBy,
                approvedAt: new Date()
              }
            }
          );
        }
      }

      return { success: true };
    }

    return { success: false, error: 'Unknown upload type' };
  } catch (error) {
    return { success: false, error: 'Failed to apply bulk upload' };
  }
}

