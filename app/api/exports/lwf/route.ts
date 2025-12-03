import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ExcelJS from 'exceljs';
import { MongoClient } from 'mongodb';

// Helper function to convert Excel date number to formatted string
const formatExcelDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    // If it's a UAN/PF number format (10 digits), it's not a date
    if (typeof dateValue === 'string' && /^\d{10}$/.test(dateValue)) {
      return '';
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
    return '';
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateValue);
    return '';
  }
};

export async function POST(req: Request) {
  try {
    const { unit, year } = await req.json();
    
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
    const processSalaryDb = mongoClient.db("ProcessSalary");

    // Get employee basic data
    const employees = await employeesDb.collection(formattedUnit)
      .find({})
      .toArray();

    // Get salary data for the year
    const salaryCollection = `salary_${year}`;
    const salaryData = await processSalaryDb.collection(salaryCollection)
      .find({
        "units": {
          $elemMatch: {
            "unit": unit
          }
        }
      })
      .toArray();

    console.log(`Found ${employees.length} employees and ${salaryData.length} salary records`);

    // Create a map of monthly salary data by employee ID
    const monthlySalaryMap = new Map();
    
    salaryData.forEach(monthData => {
      const month = parseInt(monthData.month);
      const unitData = monthData.units.find(u => u.unit === unit);
      if (unitData && unitData.records) {
        unitData.records.forEach(record => {
          if (!monthlySalaryMap.has(record.empId)) {
            monthlySalaryMap.set(record.empId, new Array(12).fill('0'));
          }
          monthlySalaryMap.get(record.empId)[month - 1] = record.earnings?.grossEarnings?.toString() || '0';
        });
      }
    });

    // Create Excel workbook and add data
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('LWF Yearly');

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Define columns
    const columns = [
      { header: 'Employee CODE', key: 'empId', width: 15 },
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Father Name', key: 'guardianName', width: 25 },
      { header: 'Aadhar No.', key: 'aadharNumber', width: 20 },
      { header: 'ESI No', key: 'esicNumber', width: 15 },
      { header: 'UAN', key: 'uanNumber', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Mobile No', key: 'mobileNumber', width: 15 },
      { header: 'DOB', key: 'dob', width: 12 },
      { header: 'January', key: 'jan', width: 10 },
      { header: 'February', key: 'feb', width: 10 },
      { header: 'March', key: 'mar', width: 10 },
      { header: 'April', key: 'apr', width: 10 },
      { header: 'May', key: 'may', width: 10 },
      { header: 'June', key: 'jun', width: 10 },
      { header: 'July', key: 'jul', width: 10 },
      { header: 'August', key: 'aug', width: 10 },
      { header: 'September', key: 'sep', width: 10 },
      { header: 'October', key: 'oct', width: 10 },
      { header: 'November', key: 'nov', width: 10 },
      { header: 'December', key: 'dec', width: 10 },
      { header: 'DOJ', key: 'doj', width: 12 }
    ];

    worksheet.columns = columns;

    if (employees.length > 0) {
      employees.forEach(employee => {
        const monthlySalaries = monthlySalaryMap.get(employee.empId) || new Array(12).fill('0');
        
        // Log raw date values for debugging
        console.log('Raw DOJ for', employee.empId, ':', employee.doj);
        
        const rowData = {
          empId: employee.empId || '',
          name: employee.name || '',
          guardianName: employee.guardianName || '',
          aadharNumber: employee.aadharNumber || '',
          esicNumber: employee.esicNumber || '',
          uanNumber: employee.uanNumber || '',
          gender: employee.gender || '',
          mobileNumber: employee.mobileNumber || '',
          dob: formatExcelDate(employee.dob),
          jan: monthlySalaries[0],
          feb: monthlySalaries[1],
          mar: monthlySalaries[2],
          apr: monthlySalaries[3],
          may: monthlySalaries[4],
          jun: monthlySalaries[5],
          jul: monthlySalaries[6],
          aug: monthlySalaries[7],
          sep: monthlySalaries[8],
          oct: monthlySalaries[9],
          nov: monthlySalaries[10],
          dec: monthlySalaries[11],
          doj: formatExcelDate(employee.doj)
        };

        // Log formatted date for debugging
        console.log('Formatted DOJ:', rowData.doj);

        const row = worksheet.addRow(rowData);

        // Format date cells specifically
        const dojCell = row.getCell('doj');
        if (rowData.doj) {
          dojCell.value = rowData.doj;
          dojCell.numFmt = 'dd/mm/yyyy';
        }

        const dobCell = row.getCell('dob');
        if (rowData.dob) {
          dobCell.value = rowData.dob;
          dobCell.numFmt = 'dd/mm/yyyy';
        }
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

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

          // Center align specific columns including dates
          if (['gender', 'dob', 'doj'].includes(currentColumn.key)) {
            cell.alignment = { horizontal: 'center' };
          }

          // Format date columns
          if (['dob', 'doj'].includes(currentColumn.key)) {
            if (rowNumber > 1 && cell.value) { // Not header row and has value
              cell.numFmt = 'dd/mm/yyyy';
            }
          }

          // Right align monthly columns
          if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(currentColumn.key)) {
            cell.alignment = { horizontal: 'right' };
            if (rowNumber > 1) {
              cell.numFmt = '0.00';
            }
          }
        });

        row.height = 20;
      });

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

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=LWF_${formattedUnit}_${year}.xlsx`
      }
    });

  } catch (error) {
    console.error('LWF Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate LWF report', details: error.message },
      { status: 500 }
    );
  }
} 





















