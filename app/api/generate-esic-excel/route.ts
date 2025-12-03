import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';
import { connectToDatabase } from '@/lib/mongodb';

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

export async function POST(request: Request) {
  try {
    const { unit, month, year } = await request.json();
    console.log('Generating ESIC Excel for:', { unit, month, year });

    // Convert month name to number (1-12)
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
    console.log('Month number:', monthNumber);

    // Connect to MongoDB
    const { db: employeeDb } = await connectToDatabase('Employees');
    const { db: salaryDb } = await connectToDatabase('ProcessSalary');

    // Format collection name
    const collectionName = unit.replace(/\s+/g, '_').toUpperCase();
    console.log('Collection name:', collectionName);

    // Get employees
    const employees = await employeeDb
      .collection(collectionName)
      .find({})
      .toArray();

    console.log(`Found ${employees.length} employees in unit ${collectionName}`);

    // Get salary data
    const salaryData = await salaryDb
      .collection(`salary_${year}`)
      .findOne({ 
        month: monthNumber.toString()
      });

    console.log('Salary data found:', salaryData ? 'Yes' : 'No');
    if (salaryData) {
      console.log('Available units:', salaryData.units?.map(u => u.unit));
    }

    if (!salaryData) {
      return NextResponse.json({
        success: false,
        error: `No salary data found for ${month}/${year}. Please process salary for this month first.`
      }, { status: 404 });
    }

    // Find unit data
    const unitData = salaryData.units?.find(u => 
      u.unit.replace(/\s+/g, '_').toUpperCase() === collectionName
    );

    if (!unitData) {
      return NextResponse.json({
        success: false,
        error: `No salary data found for unit ${unit} in ${month}/${year}`
      }, { status: 404 });
    }

    // Combine data from both sources
    const transformedData = employees
      .map(employee => {
        // Find corresponding salary record
        const salaryRecord = unitData.records.find(
          (record: any) => record.empId === employee.empId
        );

        console.log('Processing employee:', {
          empId: employee.empId,
          name: employee.name,
          hasSalaryRecord: Boolean(salaryRecord),
          esiDeduction: salaryRecord?.deductions?.esic || 0,
          doj: employee.doj
        });

        // Skip if salary record has ESI deduction as 0
        if (!salaryRecord?.deductions?.esic || salaryRecord.deductions.esic === 0) {
          return null;
        }

        // Format DOJ
        const formattedDOJ = formatExcelDate(employee.doj);
        console.log('DOJ formatting:', {
          original: employee.doj,
          formatted: formattedDOJ
        });

        return {
          'ESIC NUMBER': employee.esicNumber || employee.esiNo || '0',
          'NAME': employee.name || '',
          'DOJ': formattedDOJ,
          'PDAYS': salaryRecord?.payDays || '',
          'GROSS EARNINGS': salaryRecord?.earnings?.grossEarnings || '',
          'Reason Code': '',
          'Last Working Day': ''
        };
      })
      .filter(record => record && record['NAME']);

    console.log(`Generated ${transformedData.length} records for ESIC report`);

    if (transformedData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid ESI records found for selected unit.'
      }, { status: 404 });
    }

    // Create worksheet with headers
    const headers = [
      'ESIC NUMBER', 
      'NAME', 
      'DOJ',  // Added DOJ to headers
      'PDAYS', 
      'GROSS EARNINGS', 
      'Reason Code', 
      'Last Working Day'
    ];
    
    const ws = XLSX.utils.json_to_sheet(transformedData, { 
      header: headers,
      skipHeader: false
    });
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 },  // ESIC NUMBER
      { wch: 30 },  // NAME
      { wch: 12 },  // DOJ
      { wch: 10 },  // PDAYS
      { wch: 15 },  // GROSS EARNINGS
      { wch: 15 },  // Reason Code
      { wch: 20 },  // Last Working Day
    ];

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ESIC Report');

    // Generate buffer
    const excelBuffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=esic_report_${month}_${year}.xlsx`
      }
    });

  } catch (error) {
    console.error('Error generating ESIC Excel:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate ESIC Excel'
    }, { status: 500 });
  }
} 





















