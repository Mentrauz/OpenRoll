import * as XLSX from 'xlsx-js-style';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { format } from 'date-fns';

// Normalize unit names for matching (handle formatting differences)
const normalizeUnitName = (name: string) => {
  return name
    .replace(/_/g, ' ')          // Replace underscores with spaces
    .replace(/\./g, '')          // Remove dots
    .replace(/\s+/g, ' ')        // Normalize multiple spaces
    .replace(/\(|\)/g, '')       // Remove parentheses
    .replace(/limited/i, 'ltd')   // Normalize Limited/Ltd
    .trim()                      // Remove leading/trailing spaces
    .toLowerCase();              // Convert to lowercase
};

export async function POST(request: Request) {
  let client;
  try {
    const { unit, month, year, consolidationType, units, months, years } = await request.json();

    // Convert month to match database format (remove leading zero and ensure string)
    const monthQuery = month ? parseInt(month).toString() : null;

    console.log('Generating Consolidated Excel for:', {
      unit,
      month: monthQuery,
      year,
      consolidationType,
      units,
      months,
      years
    });

    client = await MongoClient.connect(process.env.MONGODB_URI as string);

    // First get all units from UnitsList
    const unitsDb = client.db('Units');
    const unitsListCollection = unitsDb.collection('UnitsList');
    const allUnits = await unitsListCollection.find({}).toArray();

    // Get salary data
    const processSalaryDb = client.db('ProcessSalary');
    const salaryCollection = processSalaryDb.collection(`salary_${year}`);

    let allRecords: any[] = [];
    let sheetNames: string[] = [];

    if (consolidationType === 'unit-year') {
      // All months for a specific unit
      const unitConfig = allUnits.find(u => u._id === unit);
      if (!unitConfig) {
        throw new Error(`Unit configuration not found: ${unit}`);
      }

      for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString();
        const salaryData = await salaryCollection.findOne({ month: monthStr });

        if (salaryData) {
          const unitData = salaryData.units.find((u: any) => 
            normalizeUnitName(u.unit) === normalizeUnitName(unitConfig.unitName)
          );
          if (unitData && unitData.records) {
            // Add month info to each record
            const recordsWithMonth = unitData.records.map((record: any) => ({
              ...record,
              month: new Date(0, m - 1).toLocaleString('default', { month: 'long' }),
              monthNum: m
            }));
            allRecords.push(...recordsWithMonth);
            sheetNames.push(new Date(0, m - 1).toLocaleString('default', { month: 'short' }));
          }
        }
      }
    } else if (consolidationType === 'all-units-month') {
      // All units for a specific month
      const salaryData = await salaryCollection.findOne({ month: monthQuery });

      if (!salaryData) {
        throw new Error(`No salary data found for month: ${month}, year: ${year}`);
      }

      for (const unitConfig of allUnits) {
        const unitData = salaryData.units.find((u: any) => 
          normalizeUnitName(u.unit) === normalizeUnitName(unitConfig.unitName)
        );
        if (unitData && unitData.records) {
          // Add unit info to each record
          const recordsWithUnit = unitData.records.map((record: any) => ({
            ...record,
            unitName: unitConfig.unitName
          }));
          allRecords.push(...recordsWithUnit);
          sheetNames.push(unitConfig.unitName);
        }
      }
    } else if (consolidationType === 'all-units-year') {
      // All units for all months in a year
      for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString();
        const salaryData = await salaryCollection.findOne({ month: monthStr });

        if (salaryData) {
          for (const unitConfig of allUnits) {
            const unitData = salaryData.units.find((u: any) => 
              normalizeUnitName(u.unit) === normalizeUnitName(unitConfig.unitName)
            );
            if (unitData && unitData.records) {
              // Add unit and month info to each record
              const recordsWithInfo = unitData.records.map((record: any) => ({
                ...record,
                unitName: unitConfig.unitName,
                month: new Date(0, m - 1).toLocaleString('default', { month: 'long' }),
                monthNum: m
              }));
              allRecords.push(...recordsWithInfo);
            }
          }
        }
      }
      sheetNames = ['Consolidated'];
    } else if (consolidationType === 'custom') {
      // Custom selection: multiple units, months, and years
      for (const selectedYear of years) {
        const salaryCollection = processSalaryDb.collection(`salary_${selectedYear}`);
        
        // Convert month strings to integers
        const selectedMonths = months.map((m: string) => parseInt(m).toString());
        
        for (const monthStr of selectedMonths) {
          const salaryData = await salaryCollection.findOne({ month: monthStr });
          
          if (salaryData) {
            // Get unit configs for selected units
            const selectedUnitConfigs = allUnits.filter(u => units.includes(u._id));
            
            for (const unitConfig of selectedUnitConfigs) {
              const unitData = salaryData.units.find((u: any) => 
                normalizeUnitName(u.unit) === normalizeUnitName(unitConfig.unitName)
              );
              if (unitData && unitData.records) {
                // Add unit, month, and year info to each record
                const recordsWithInfo = unitData.records.map((record: any) => ({
                  ...record,
                  unitName: unitConfig.unitName,
                  month: new Date(0, parseInt(monthStr) - 1).toLocaleString('default', { month: 'long' }),
                  monthNum: parseInt(monthStr),
                  year: selectedYear
                }));
                allRecords.push(...recordsWithInfo);
              }
            }
          }
        }
      }
      sheetNames = ['Custom'];
    }

    if (!allRecords.length) {
      throw new Error('No salary records found to generate consolidated report');
    }

    // Fetch employees data from Employees database for additional info
    const employeesDb = client.db('Employees');
    const allEmployees = new Map();

    // Cache employee data for all units
    for (const unitConfig of allUnits) {
      try {
        const employeeCollection = employeesDb.collection(unitConfig._id);
        const employees = await employeeCollection.find({}).toArray();
        employees.forEach(emp => {
          allEmployees.set(`${unitConfig._id}-${emp.empId}`, emp);
        });
      } catch (error) {
        console.log(`Could not fetch employees for unit ${unitConfig._id}:`, error);
      }
    }

    // Helper function for Excel date conversion
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

    // Create workbook
    const wb = XLSX.utils.book_new();

    if (consolidationType === 'unit-year' || consolidationType === 'all-units-month' || consolidationType === 'custom') {
      // Create separate sheets for each month/unit or single sheet for custom
      const sheets = consolidationType === 'custom' ? ['Custom'] : sheetNames;
      
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i];
        const sheetRecords = consolidationType === 'custom' ? allRecords : allRecords.filter(record => {
          if (consolidationType === 'unit-year') {
            return record.monthNum === (i + 1);
          } else {
            return record.unitName === sheetName;
          }
        });

        if (sheetRecords.length > 0) {
          const processedRecords = sheetRecords.map((record: any, index: number) => {
            // Find matching employee from employee collection
            const unitId = consolidationType === 'unit-year' ? unit : allUnits.find(u => u.unitName === record.unitName)?._id;
            const employee = allEmployees.get(`${unitId}-${record.empId}`);

            return {
              'Sl.No': index + 1,
              ...(consolidationType === 'all-units-month' && { 'Unit': record.unitName || '' }),
              ...(consolidationType === 'unit-year' && { 'Month': record.month || '' }),
              ...(consolidationType === 'custom' && { 
                'Unit': record.unitName || '',
                'Month': record.month || '',
                'Year': record.year || ''
              }),
              'Emp Code': record.empId || '',
              'Emp Name': record.name || '',
              'Guardian Name': record.guardianName || '',
              'DOJ': formatExcelDate(record.doj || employee?.doj) || '',
              'UAN/PF No': record.uanNumber || employee?.uanNumber || '',
              'ESI No': record.esicNumber || employee?.esicNumber || '',
              'Aadhar No': record.aadharNumber || employee?.aadharNumber || '',
              'IFSC Code': record.bankDetails?.ifscCode || record.ifscCode || '',
              'Bank A/c No.': record.bankDetails?.accountNumber || record.bankAccount || '',
              'Pay Days': record.payDays || 0,
              'Basic': record.earnings?.basic || 0,
              'HRA': record.earnings?.hra || 0,
              'Conv': record.earnings?.conv || 0,
              'Wash All': record.earnings?.washAll || 0,
              'Oth All': record.earnings?.othAll || 0,
              'Arrear': record.earnings?.arrear || 0,
              'Att Award': record.earnings?.attAward || 0,
              'Spl All': record.earnings?.splAll || 0,
              'Food All': record.earnings?.foodAll || 0,
              'Prod All': record.earnings?.prodAll || 0,
              'Night All': record.earnings?.nightAll || 0,
              'Tran All': record.earnings?.tranAll || 0,
              'Gross Earnings': record.earnings?.grossEarnings || 0,
              'PF': record.deductions?.pf || 0,
              'ESIC': record.deductions?.esic || 0,
              'LWF': record.deductions?.lwf || 0,
              'Adv Ded': record.deductions?.advDed || 0,
              'Unf Ded': record.deductions?.unfDed || 0,
              'TPA Ded': record.deductions?.tpaDed || 0,
              'Food Ded': record.deductions?.foodDed || 0,
              'Total Deductions': record.deductions?.totalDeductions || 0,
              'Net Payable': record.netPayable || 0
            };
          });

          // Add totals row
          const totalsRow = {
            'Sl.No': 0,
            ...(consolidationType === 'all-units-month' && { 'Unit': 'Total' }),
            ...(consolidationType === 'unit-year' && { 'Month': 'Total' }),
            ...(consolidationType === 'custom' && { 
              'Unit': 'Total',
              'Month': '',
              'Year': ''
            }),
            'Emp Code': 'Total',
            'Emp Name': '',
            'Guardian Name': '',
            'DOJ': '',
            'UAN/PF No': '',
            'ESI No': '',
            'Aadhar No': '',
            'IFSC Code': '',
            'Bank A/c No.': '',
            'Pay Days': processedRecords.reduce((sum, record) => sum + (record['Pay Days'] || 0), 0),
            'Basic': processedRecords.reduce((sum, record) => sum + (record['Basic'] || 0), 0),
            'HRA': processedRecords.reduce((sum, record) => sum + (record['HRA'] || 0), 0),
            'Conv': processedRecords.reduce((sum, record) => sum + (record['Conv'] || 0), 0),
            'Wash All': processedRecords.reduce((sum, record) => sum + (record['Wash All'] || 0), 0),
            'Oth All': processedRecords.reduce((sum, record) => sum + (record['Oth All'] || 0), 0),
            'Arrear': processedRecords.reduce((sum, record) => sum + (record['Arrear'] || 0), 0),
            'Att Award': processedRecords.reduce((sum, record) => sum + (record['Att Award'] || 0), 0),
            'Spl All': processedRecords.reduce((sum, record) => sum + (record['Spl All'] || 0), 0),
            'Food All': processedRecords.reduce((sum, record) => sum + (record['Food All'] || 0), 0),
            'Prod All': processedRecords.reduce((sum, record) => sum + (record['Prod All'] || 0), 0),
            'Night All': processedRecords.reduce((sum, record) => sum + (record['Night All'] || 0), 0),
            'Tran All': processedRecords.reduce((sum, record) => sum + (record['Tran All'] || 0), 0),
            'Gross Earnings': processedRecords.reduce((sum, record) => sum + (record['Gross Earnings'] || 0), 0),
            'PF': processedRecords.reduce((sum, record) => sum + (record['PF'] || 0), 0),
            'ESIC': processedRecords.reduce((sum, record) => sum + (record['ESIC'] || 0), 0),
            'LWF': processedRecords.reduce((sum, record) => sum + (record['LWF'] || 0), 0),
            'Adv Ded': processedRecords.reduce((sum, record) => sum + (record['Adv Ded'] || 0), 0),
            'Unf Ded': processedRecords.reduce((sum, record) => sum + (record['Unf Ded'] || 0), 0),
            'TPA Ded': processedRecords.reduce((sum, record) => sum + (record['TPA Ded'] || 0), 0),
            'Food Ded': processedRecords.reduce((sum, record) => sum + (record['Food Ded'] || 0), 0),
            'Total Deductions': processedRecords.reduce((sum, record) => sum + (record['Total Deductions'] || 0), 0),
            'Net Payable': processedRecords.reduce((sum, record) => sum + (record['Net Payable'] || 0), 0)
          };

          processedRecords.push(totalsRow);

          // Create worksheet
          const ws = XLSX.utils.json_to_sheet(processedRecords);

          // Set column widths with padding columns
          const columnWidths = Object.keys(processedRecords[0]).map(key => ({
            wch: Math.max(key.length, 10) // Minimum width of 10
          }));

          // Apply minimum widths for specific columns
          const minWidths: { [key: string]: number } = {
            'Sl.No': 6,
            'Emp Code': 10,
            'Emp Name': 15,
            'Guardian Name': 15,
            'DOJ': 10,
            'UAN/PF No': 12,
            'ESI No': 12,
            'Aadhar No': 12,
            'IFSC Code': 15,
            'Bank A/c No.': 20,
            'Pay Days': 8,
            'Basic': 8,
            'HRA': 8,
            'Net Payable': 10
          };

          columnWidths.forEach((col, index) => {
            const key = Object.keys(processedRecords[0])[index];
            if (minWidths[key]) {
              col.wch = Math.max(col.wch, minWidths[key]);
            }
            col.wch = Math.min(col.wch, 30);
          });

          ws['!cols'] = columnWidths;

          // Apply styles
          const headerFooterStyle = {
            fill: { fgColor: { rgb: "D3D3D3" }, patternType: "solid" },
            font: { bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true }
          };

          const dataCellStyle = {
            alignment: { horizontal: "center", vertical: "center" }
          };

          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          
          // Style all cells
          for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              if (!ws[cellAddress]) continue;
              
              // Apply header style to first row
              if (row === 0) {
                ws[cellAddress].s = headerFooterStyle;
              }
              // Apply footer style to last row (totals)
              else if (row === range.e.r) {
                ws[cellAddress].s = headerFooterStyle;
              }
              // Apply centered data cell style to all other cells
              else {
                ws[cellAddress].s = dataCellStyle;
              }
            }
          }

          XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel sheet name limit
        }
      }
    } else if (consolidationType === 'all-units-year') {
      // Single consolidated sheet for all units and months
      const processedRecords = allRecords.map((record: any, index: number) => {
        const unitId = allUnits.find(u => u.unitName === record.unitName)?._id;
        const employee = allEmployees.get(`${unitId}-${record.empId}`);

        return {
          'Sl.No': index + 1,
          'Unit': record.unitName || '',
          'Month': record.month || '',
          'Emp Code': record.empId || '',
          'Emp Name': record.name || '',
          'Guardian Name': record.guardianName || '',
          'DOJ': formatExcelDate(record.doj || employee?.doj) || '',
          'UAN/PF No': record.uanNumber || employee?.uanNumber || '',
          'ESI No': record.esicNumber || employee?.esicNumber || '',
          'Aadhar No': record.aadharNumber || employee?.aadharNumber || '',
          'IFSC Code': record.bankDetails?.ifscCode || record.ifscCode || '',
          'Bank A/c No.': record.bankDetails?.accountNumber || record.bankAccount || '',
          'Pay Days': record.payDays || 0,
          'Basic': record.earnings?.basic || 0,
          'HRA': record.earnings?.hra || 0,
          'Conv': record.earnings?.conv || 0,
          'Wash All': record.earnings?.washAll || 0,
          'Oth All': record.earnings?.othAll || 0,
          'Arrear': record.earnings?.arrear || 0,
          'Att Award': record.earnings?.attAward || 0,
          'Spl All': record.earnings?.splAll || 0,
          'Food All': record.earnings?.foodAll || 0,
          'Prod All': record.earnings?.prodAll || 0,
          'Night All': record.earnings?.nightAll || 0,
          'Tran All': record.earnings?.tranAll || 0,
          'Gross Earnings': record.earnings?.grossEarnings || 0,
          'PF': record.deductions?.pf || 0,
          'ESIC': record.deductions?.esic || 0,
          'LWF': record.deductions?.lwf || 0,
          'Adv Ded': record.deductions?.advDed || 0,
          'Unf Ded': record.deductions?.unfDed || 0,
          'TPA Ded': record.deductions?.tpaDed || 0,
          'Food Ded': record.deductions?.foodDed || 0,
          'Total Deductions': record.deductions?.totalDeductions || 0,
          'Net Payable': record.netPayable || 0
        };
      });

      // Add totals row
      const totalsRow = {
        'Sl.No': 0,
        'Unit': 'Total',
        'Month': '',
        'Emp Code': 'Total',
        'Emp Name': '',
        'Guardian Name': '',
        'DOJ': '',
        'UAN/PF No': '',
        'ESI No': '',
        'Aadhar No': '',
        'IFSC Code': '',
        'Bank A/c No.': '',
        'Pay Days': processedRecords.reduce((sum, record) => sum + (record['Pay Days'] || 0), 0),
        'Basic': processedRecords.reduce((sum, record) => sum + (record['Basic'] || 0), 0),
        'HRA': processedRecords.reduce((sum, record) => sum + (record['HRA'] || 0), 0),
        'Conv': processedRecords.reduce((sum, record) => sum + (record['Conv'] || 0), 0),
        'Wash All': processedRecords.reduce((sum, record) => sum + (record['Wash All'] || 0), 0),
        'Oth All': processedRecords.reduce((sum, record) => sum + (record['Oth All'] || 0), 0),
        'Arrear': processedRecords.reduce((sum, record) => sum + (record['Arrear'] || 0), 0),
        'Att Award': processedRecords.reduce((sum, record) => sum + (record['Att Award'] || 0), 0),
        'Spl All': processedRecords.reduce((sum, record) => sum + (record['Spl All'] || 0), 0),
        'Food All': processedRecords.reduce((sum, record) => sum + (record['Food All'] || 0), 0),
        'Prod All': processedRecords.reduce((sum, record) => sum + (record['Prod All'] || 0), 0),
        'Night All': processedRecords.reduce((sum, record) => sum + (record['Night All'] || 0), 0),
        'Tran All': processedRecords.reduce((sum, record) => sum + (record['Tran All'] || 0), 0),
        'Gross Earnings': processedRecords.reduce((sum, record) => sum + (record['Gross Earnings'] || 0), 0),
        'PF': processedRecords.reduce((sum, record) => sum + (record['PF'] || 0), 0),
        'ESIC': processedRecords.reduce((sum, record) => sum + (record['ESIC'] || 0), 0),
        'LWF': processedRecords.reduce((sum, record) => sum + (record['LWF'] || 0), 0),
        'Adv Ded': processedRecords.reduce((sum, record) => sum + (record['Adv Ded'] || 0), 0),
        'Unf Ded': processedRecords.reduce((sum, record) => sum + (record['Unf Ded'] || 0), 0),
        'TPA Ded': processedRecords.reduce((sum, record) => sum + (record['TPA Ded'] || 0), 0),
        'Food Ded': processedRecords.reduce((sum, record) => sum + (record['Food Ded'] || 0), 0),
        'Total Deductions': processedRecords.reduce((sum, record) => sum + (record['Total Deductions'] || 0), 0),
        'Net Payable': processedRecords.reduce((sum, record) => sum + (record['Net Payable'] || 0), 0)
      };

      processedRecords.push(totalsRow);

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(processedRecords);

      // Set column widths
      const columnWidths = Object.keys(processedRecords[0]).map(key => ({
        wch: Math.max(key.length, 10)
      }));

      const minWidths: { [key: string]: number } = {
        'Sl.No': 6,
        'Unit': 15,
        'Month': 10,
        'Emp Code': 10,
        'Emp Name': 15,
        'Guardian Name': 15,
        'DOJ': 10,
        'UAN/PF No': 12,
        'ESI No': 12,
        'Aadhar No': 12,
        'IFSC Code': 15,
        'Bank A/c No.': 20,
        'Pay Days': 8,
        'Basic': 8,
        'HRA': 8,
        'Net Payable': 10
      };

      columnWidths.forEach((col, index) => {
        const key = Object.keys(processedRecords[0])[index];
        if (minWidths[key]) {
          col.wch = Math.max(col.wch, minWidths[key]);
        }
        col.wch = Math.min(col.wch, 30);
      });

      ws['!cols'] = columnWidths;

      // Apply styles
      const headerFooterStyle = {
        fill: { fgColor: { rgb: "D3D3D3" }, patternType: "solid" },
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
      };

      const dataCellStyle = {
        alignment: { horizontal: "center", vertical: "center" }
      };

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Style all cells
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;
          
          // Apply header style to first row
          if (row === 0) {
            ws[cellAddress].s = headerFooterStyle;
          }
          // Apply footer style to last row (totals)
          else if (row === range.e.r) {
            ws[cellAddress].s = headerFooterStyle;
          }
          // Apply centered data cell style to all other cells
          else {
            ws[cellAddress].s = dataCellStyle;
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Consolidated');
    }

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="consolidated_salary_report.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating consolidated salary report:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate consolidated salary report'
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
