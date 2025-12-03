import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ExcelJS from 'exceljs';
import { MongoClient } from 'mongodb';
import { format, isValid, parse } from 'date-fns';

// Helper function to format dates consistently
const formatExcelDate = (dateValue: any): string => {
  if (!dateValue) return '-';
  
  try {
    // If it's a UAN/PF number format (10 digits), it's not a date
    if (typeof dateValue === 'string' && /^\d{10}$/.test(dateValue)) {
      return '-';
    }

    // If it's already a date string in DD/MM/YYYY format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateValue;
    }

    // If it's already a date string in YYYY-MM-DD format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split('-');
      return `${day}/${month}/${year}`;
    }

    // If it's a number (Excel date)
    if (typeof dateValue === 'number' || !isNaN(Number(dateValue))) {
      const date = new Date((Number(dateValue) - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }

    // Try parsing as regular date string
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    console.log('Invalid date value:', dateValue);
    return '-';
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateValue);
    return '-';
  }
};

export async function POST(req: Request) {
  try {
    const { unit, year, month } = await req.json();
    
    // Format the collection name for Employees database
    const formattedUnit = unit
      .replace(/\s*\(Sector\s*\d+\)/i, (match) => {
        const sectorNum = match.match(/\d+/)[0];
        return `_(SECTOR_${sectorNum})`
      })
      .replace(/\s+/g, '_')           
      .replace(/\.(?!\s)/g, '.')      
      .toUpperCase();                 

    // Connect to databases
    const mongoClient = await MongoClient.connect(process.env.MONGODB_URI as string);
    const employeesDb = mongoClient.db("Employees");
    const attendanceDb = mongoClient.db("Attendance");

    // Get employee basic data
    const employees = await employeesDb.collection(formattedUnit)
      .find({})
      .toArray();

    // Get attendance data for the specified month and year
    const attendanceCollection = `attendance_${year}`;
    const attendanceData = await attendanceDb.collection(attendanceCollection)
      .findOne({
        month: month,
        "units": {
          $elemMatch: {
            "unit": unit
          }
        }
      });

    // Create a set of employee IDs from attendance records
    const activeEmployeeIds = new Set();
    if (attendanceData && attendanceData.units) {
      const unitData = attendanceData.units.find(u => u.unit === unit);
      if (unitData && unitData.records) {
        unitData.records.forEach(record => {
          activeEmployeeIds.add(record.EMPID);
        });
      }
    }

    console.log(`Found ${employees.length} total employees and ${activeEmployeeIds.size} active employees`);

    // After getting employees
    console.log('Sample employee IDs:', employees.slice(0, 3).map(e => e.empId));
    console.log('All employee IDs:', employees.map(e => e.empId));

    // After getting attendance records
    console.log('Sample attendance IDs:', Array.from(activeEmployeeIds).slice(0, 3));
    console.log('All attendance IDs:', Array.from(activeEmployeeIds));

    // Create Excel workbook and add data
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PF ESI Details');

    // Define columns
    const columns = [
      { header: 'Employee CODE', key: 'empId', width: 15 },
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Father Name', key: 'guardianName', width: 25 },
      { header: 'UAN Number', key: 'uanNumber', width: 15 },
      { header: 'ESI Number', key: 'esicNumber', width: 15 },
      { header: 'Aadhar Number', key: 'aadharNumber', width: 20 },
      { header: 'DOJ', key: 'doj', width: 12 },
      { header: 'DOB', key: 'dob', width: 12 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Mobile No', key: 'mobileNumber', width: 15 }
    ];

    worksheet.columns = columns;

    if (employees.length > 0) {
      const activeEmployees = employees.filter(employee => 
        Array.from(activeEmployeeIds).some(id => 
          id.toString().toLowerCase() === employee.empId.toString().toLowerCase()
        )
      );

      activeEmployees.forEach(employee => {
        console.log('Raw DOJ value:', employee.doj, typeof employee.doj);
        
        const rowData = {
          empId: employee.empId || '',
          name: employee.name || '',
          guardianName: employee.guardianName || '',
          uanNumber: employee.uanNumber || '',
          esicNumber: employee.esicNumber || '',
          aadharNumber: employee.aadharNumber || '',
          doj: formatExcelDate(employee.doj),
          dob: formatExcelDate(employee.dob),
          gender: employee.gender || '',
          mobileNumber: employee.mobileNumber || ''
        };

        console.log('Formatted DOJ:', rowData.doj);
        const row = worksheet.addRow(rowData);

        // Apply date formatting to cells
        const dojCell = row.getCell('doj');
        const dobCell = row.getCell('dob');

        if (rowData.doj !== '-') {
          dojCell.value = rowData.doj;
          dojCell.numFmt = 'dd/mm/yyyy';
        }

        if (rowData.dob !== '-') {
          dobCell.value = rowData.dob;
          dobCell.numFmt = 'dd/mm/yyyy';
        }
      });

      // Style improvements
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          // Add borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          const currentColumn = columns[colNumber - 1];
          if (!currentColumn) return;

          // Center align specific columns
          if (['gender', 'dob', 'doj', 'uanNumber', 'esicNumber', 'aadharNumber'].includes(currentColumn.key)) {
            cell.alignment = { horizontal: 'center' };
          }

          // Format date columns
          if (['dob', 'doj'].includes(currentColumn.key)) {
            if (rowNumber > 1 && cell.value) {
              cell.numFmt = 'dd/mm/yyyy';
            }
          }
        });

        row.height = 20;
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Freeze the header row
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
      ];

      // Auto-filter for all columns
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length }
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    await mongoClient.close();

    // Convert buffer to base64
    const base64 = Buffer.from(buffer).toString('base64');

    // Create sets for comparison
    const employeeIds = new Set(employees.map(e => e.empId));
    const attendanceIds = new Set();
    
    if (attendanceData && attendanceData.units) {
      const unitData = attendanceData.units.find(u => u.unit === unit);
      if (unitData && unitData.records) {
        unitData.records.forEach(record => {
          attendanceIds.add(record.EMPID);
        });
      }
    }

    // Find discrepancies
    const employeesOnly = [...employeeIds].filter(id => !attendanceIds.has(id));
    const attendanceOnly = [...attendanceIds].filter(id => !employeeIds.has(id));

    console.log('Inactive employees (in database but no attendance):', employeesOnly);
    console.log('Missing employees (in attendance but not in database):', attendanceOnly);

    return NextResponse.json({
      success: true,
      file: base64,
      missingData: {
        inactiveEmployees: employeesOnly,  // In database but no attendance
        missingEmployees: attendanceOnly   // In attendance but not in database
      },
      message: employeesOnly.length > 0 
        ? `Found ${employeesOnly.length} employees in database with no attendance records for the selected month.`
        : 'All employees have attendance records for the selected month.'
    });

  } catch (error) {
    console.error('PF/ESI Export Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PF/ESI report', 
        details: error.message 
      },
      { status: 500 }
    );
  }
} 





















