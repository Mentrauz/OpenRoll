import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { MongoClient } from 'mongodb';

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

    console.log('Generating Consolidated PDF for:', {
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
    const employeesDb = client.db('Employees');

    let allRecords: any[] = [];

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
            // Fetch employee details for this unit
            const employeeCollection = employeesDb.collection(unit);
            const employees = await employeeCollection.find({}).toArray();

            // Add month info and merge employee details
            const recordsWithMonth = await Promise.all(unitData.records.map(async (record: any) => {
              const employee = employees.find(emp => emp.empId === record.empId);

              return {
                ...record,
                month: new Date(0, m - 1).toLocaleString('default', { month: 'long' }),
                monthNum: m,
                unitName: unitConfig.unitName,
                esiNo: record.esicNumber || record.esiNo || employee?.esicNumber || '',
                adharNo: record.aadharNumber || record.adharNo || employee?.aadharNumber || '',
                uanNo: record.uanNumber || record.uanNo || employee?.uanNumber || ''
              };
            }));

            allRecords.push(...recordsWithMonth);
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
          // Fetch employee details for this unit
          const employeeCollection = employeesDb.collection(unitConfig._id);
          const employees = await employeeCollection.find({}).toArray();

          // Add unit info and merge employee details
          const recordsWithUnit = await Promise.all(unitData.records.map(async (record: any) => {
            const employee = employees.find(emp => emp.empId === record.empId);

            return {
              ...record,
              unitName: unitConfig.unitName,
              esiNo: record.esicNumber || record.esiNo || employee?.esicNumber || '',
              adharNo: record.aadharNumber || record.adharNo || employee?.aadharNumber || '',
              uanNo: record.uanNumber || record.uanNo || employee?.uanNumber || ''
            };
          }));

          allRecords.push(...recordsWithUnit);
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
              // Fetch employee details for this unit
              const employeeCollection = employeesDb.collection(unitConfig._id);
              const employees = await employeeCollection.find({}).toArray();

              // Add unit and month info and merge employee details
              const recordsWithInfo = await Promise.all(unitData.records.map(async (record: any) => {
                const employee = employees.find(emp => emp.empId === record.empId);

                return {
                  ...record,
                  unitName: unitConfig.unitName,
                  month: new Date(0, m - 1).toLocaleString('default', { month: 'long' }),
                  monthNum: m,
                  esiNo: record.esicNumber || record.esiNo || employee?.esicNumber || '',
                  adharNo: record.aadharNumber || record.adharNo || employee?.aadharNumber || '',
                  uanNo: record.uanNumber || record.uanNo || employee?.uanNumber || ''
                };
              }));

              allRecords.push(...recordsWithInfo);
            }
          }
        }
      }
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
            
            console.log('Selected unit configs:', selectedUnitConfigs.map(u => ({ _id: u._id, unitName: u.unitName })));
            console.log('Available units in salary data:', salaryData.units?.map((u: any) => u.unit));
            
            for (const unitConfig of selectedUnitConfigs) {
              console.log('Looking for unit:', unitConfig.unitName, 'normalized:', normalizeUnitName(unitConfig.unitName));
              
              const unitData = salaryData.units.find((u: any) => 
                normalizeUnitName(u.unit) === normalizeUnitName(unitConfig.unitName)
              );
              
              if (!unitData) {
                console.log('Unit not found in salary data:', unitConfig.unitName);
                console.log('Available normalized units:', salaryData.units?.map((u: any) => 
                  `${u.unit} -> ${normalizeUnitName(u.unit)}`
                ));
              }
              
              if (unitData && unitData.records) {
                console.log('Found unit data with', unitData.records.length, 'records');
                // Fetch employee details for this unit
                const employeeCollection = employeesDb.collection(unitConfig._id);
                const employees = await employeeCollection.find({}).toArray();

                // Add unit, month, and year info and merge employee details
                const recordsWithInfo = await Promise.all(unitData.records.map(async (record: any) => {
                  const employee = employees.find(emp => emp.empId === record.empId);

                  return {
                    ...record,
                    unitName: unitConfig.unitName,
                    month: new Date(0, parseInt(monthStr) - 1).toLocaleString('default', { month: 'long' }),
                    monthNum: parseInt(monthStr),
                    year: selectedYear,
                    esiNo: record.esicNumber || record.esiNo || employee?.esicNumber || '',
                    adharNo: record.aadharNumber || record.adharNo || employee?.aadharNumber || '',
                    uanNo: record.uanNumber || record.uanNo || employee?.uanNumber || ''
                  };
                }));

                allRecords.push(...recordsWithInfo);
              }
            }
          }
        }
      }
    }

    if (!allRecords.length) {
      throw new Error('No salary records found to generate consolidated report');
    }

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Define column widths
    const columnWidths = {
      srNo: 10,
      ...(consolidationType === 'all-units-month' && { unit: 25 }),
      ...(consolidationType === 'unit-year' && { month: 20 }),
      ...(consolidationType === 'all-units-year' && { unit: 22, month: 15 }),
      ...(consolidationType === 'custom' && { unit: 22, month: 15, year: 12 }),
      empId: 20,
      empName: 26,
      esiNo: 26,
      pDays: 7,
      basicHRAConv: 15,
      washOthAllTrans: 15,
      prodAllArrear: 15,
      foodAllNight: 15,
      grossEarning: 15,
      pfEsiLwf: 15,
      advanceUnfPt: 15,
      foodDedTpa: 15,
      totalDed: 15,
      netPay: 15
    };

    // Calculate total width and center the table with 5mm margins
    const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
    const pageWidth = 297; // A4 landscape width in mm
    const marginLeft = 5;
    const marginRight = 5;
    const startX = (pageWidth - totalWidth) / 2; // Center the table

    // Define headers
    const headers = [
      { text: 'Sr.No.', width: columnWidths.srNo },
      ...(consolidationType === 'all-units-month' ? [{ text: 'Unit', width: columnWidths.unit }] : []),
      ...(consolidationType === 'unit-year' ? [{ text: 'Month', width: columnWidths.month }] : []),
      ...(consolidationType === 'all-units-year' ? [
        { text: 'Unit', width: columnWidths.unit },
        { text: 'Month', width: columnWidths.month }
      ] : []),
      ...(consolidationType === 'custom' ? [
        { text: 'Unit', width: columnWidths.unit },
        { text: 'Month', width: columnWidths.month },
        { text: 'Year', width: columnWidths.year }
      ] : []),
      { text: 'EmpID', width: columnWidths.empId },
      { text: 'Employee Name\nGaurdian Name', width: columnWidths.empName, yOffset: -2 },
      { text: 'ESI NO.\nAdhar NO.\nUAN NO.', width: columnWidths.esiNo, yOffset: -2 },
      { text: 'P. Days', width: columnWidths.pDays },
      { text: 'Basic\nHRA\nConv.', width: columnWidths.basicHRAConv, yOffset: -2 },
      { text: 'Wash\nOth.All\nTrans. All.', width: columnWidths.washOthAllTrans, yOffset: -2 },
      { text: 'ProdAll.\nArrear\nAttAwd', width: columnWidths.prodAllArrear, yOffset: -2 },
      { text: 'Food All.\nNight All.\nSpl. All', width: columnWidths.foodAllNight, yOffset: -2 },
      { text: 'Gross\nEarning', width: columnWidths.grossEarning },
      { text: 'PF\nESI\nLWF', width: columnWidths.pfEsiLwf, yOffset: -2 },
      { text: 'Advance\nUnf Ded\nFood Ded', width: columnWidths.advanceUnfPt, yOffset: -2 },
      { text: 'TPA\nDed', width: columnWidths.foodDedTpa, yOffset: -2 },
      { text: 'Total\nDed', width: columnWidths.totalDed },
      { text: 'Net\nPay', width: columnWidths.netPay }
    ];

    // Function to add header to each page
    function addPageHeader(doc: jsPDF) {
      // Add header with proper spacing
      doc.setFontSize(11);
      doc.text('TONDAK MANPOWER Services.', 8, 20);
      doc.text('CONSOLIDATED SALARY REPORT', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(',', '');
      doc.text(currentDate, doc.internal.pageSize.width - 8, 20, { align: 'right' });

      // Company address and details
      doc.setFontSize(10);
      doc.text('FLOOR 2 SCO 19, SECTOR 23A', 8, 25);
      doc.text('FORM XIII', doc.internal.pageSize.width / 2, 25, { align: 'center' });
      doc.text('GURUGRAM', 8, 30);
      doc.text('REGISTER OF WAGES', doc.internal.pageSize.width / 2, 30, { align: 'center' });
      doc.text('HARYANA', 8, 35);

      // Add consolidation type info
      let reportType = '';
      if (consolidationType === 'unit-year') {
        const unitConfig = allUnits.find(u => u._id === unit);
        reportType = `All Months - ${unitConfig?.unitName} (${year})`;
      } else if (consolidationType === 'all-units-month') {
        const monthName = new Date(0, parseInt(month) - 1).toLocaleString('default', { month: 'long' });
        reportType = `All Units - ${monthName} ${year}`;
      } else if (consolidationType === 'all-units-year') {
        reportType = `All Units All Months - ${year}`;
      } else if (consolidationType === 'custom') {
        reportType = `Custom Report - ${units.length} Unit(s), ${months.length} Month(s), ${years.length} Year(s)`;
      }
      doc.text(reportType, doc.internal.pageSize.width / 2, 35, { align: 'center' });

      // Registration numbers
      doc.text('Comp. PF NO. -GNGGN2253798000', 8, 40);
      doc.text('Comp. ESINO. -69000696210001019', 8, 45);

      // Add table headers
      const startY = 50;
      let xPos = startX;

      // Draw header background
      doc.setFillColor(211, 211, 211);
      doc.rect(startX, startY, totalWidth, 15, 'F');

      // Add headers
      doc.setFontSize(6);
      headers.forEach(header => {
        const yOffset = header.yOffset || 0;
        doc.text(header.text, xPos + header.width/2, startY + 8 + yOffset, {
          align: 'center',
          maxWidth: header.width - 1
        });
        xPos += header.width;
      });

      // Draw table grid for header
      xPos = startX;
      doc.setDrawColor(0);

      // Vertical lines
      Object.values(columnWidths).forEach(width => {
        doc.line(xPos, startY, xPos, startY + 15);
        xPos += width;
      });
      doc.line(xPos, startY, xPos, startY + 15);

      // Horizontal lines
      doc.line(startX, startY, xPos, startY);
      doc.line(startX, startY + 15, xPos, startY + 15);

      return startY + 15; // Return the Y position where content should start
    }

    // Add header to first page
    let yPos = addPageHeader(doc);
    let currentRecord = 0;
    const RECORDS_PER_PAGE = 6;

    // Helper function to center text in a column
    function drawCenteredText(doc: jsPDF, text: string, x: number, y: number, width: number) {
      const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
      const textX = x + (width - textWidth) / 2;
      doc.text(text.toString(), textX, y);
    }

    // Calculate total earned basic + arrear for EPF contributions (BEFORE consolidatedTotals)
    const totalEarnedBasicPlusArrearForContrib = allRecords.reduce((sum, record) => 
      sum + (Number(record.earnings?.basic) || 0) + (Number(record.earnings?.arrear) || 0), 0);

    // Calculate EPF contributions based on (basic + arrear) - this is the CORRECT value
    const contributions = {
      employee: { epfAC1: totalEarnedBasicPlusArrearForContrib * 0.12 },
      employer: {
        epfAC1: totalEarnedBasicPlusArrearForContrib * 0.0367,
        fpfAC10: totalEarnedBasicPlusArrearForContrib * 0.0833,
        dliAC21: totalEarnedBasicPlusArrearForContrib * 0.005,
        admPFAC2: totalEarnedBasicPlusArrearForContrib * 0.005,
        admPFAC22: 0
      }
    };

    // Calculate consolidated totals for summary page
    const consolidatedTotals = allRecords.reduce((acc: any, record: any) => ({
      employeeCount: acc.employeeCount + 1,
      totalEBasic: acc.totalEBasic + (Number(record.earnings?.basic) || 0),
      totalArrear: acc.totalArrear + (Number(record.earnings?.arrear) || 0),
      totalEBasicPlusArrear: acc.totalEBasicPlusArrear + (Number(record.earnings?.basic) || 0) + (Number(record.earnings?.arrear) || 0),
      totalGrossEarnings: acc.totalGrossEarnings + (Number(record.earnings?.grossEarnings) || 0),
      totalPF: acc.totalPF + (Number(record.deductions?.pf) || 0),
      totalESIC: acc.totalESIC + (Number(record.deductions?.esic) || 0),
      totalLWF: acc.totalLWF + (Number(record.deductions?.lwf) || 0),
      basicHRAConv: {
        basic: acc.basicHRAConv.basic + (Number(record.standard?.basic) || 0),
        hra: acc.basicHRAConv.hra + (Number(record.standard?.hra) || 0),
        conv: acc.basicHRAConv.conv + (Number(record.standard?.conveyance) || 0)
      },
      othGross: {
        oth: acc.othGross.oth + (Number(record.standard?.oth) || 0),
        gross: acc.othGross.gross + (Number(record.standard?.gross) || 0)
      },
      eBasicHRAConv: {
        basic: acc.eBasicHRAConv.basic + (Number(record.earnings?.basic) || 0),
        hra: acc.eBasicHRAConv.hra + (Number(record.earnings?.hra) || 0),
        conv: acc.eBasicHRAConv.conv + (Number(record.earnings?.conv) || 0)
      },
      washOthTrans: {
        wash: acc.washOthTrans.wash + (Number(record.earnings?.washAll) || 0),
        othAll: acc.washOthTrans.othAll + (Number(record.earnings?.othAll) || 0),
        trans: acc.washOthTrans.trans + (Number(record.earnings?.tranAll) || 0)
      },
      prodArrearAtt: {
        prod: acc.prodArrearAtt.prod + (Number(record.earnings?.prodAll) || 0),
        arrear: acc.prodArrearAtt.arrear + (Number(record.earnings?.arrear) || 0),
        att: acc.prodArrearAtt.att + (Number(record.earnings?.attAward) || 0)
      },
      foodNightSpl: {
        food: acc.foodNightSpl.food + (Number(record.earnings?.foodAll) || 0),
        night: acc.foodNightSpl.night + (Number(record.earnings?.nightAll) || 0),
        spl: acc.foodNightSpl.spl + (Number(record.earnings?.splAll) || 0)
      },
      pfEsiLwf: {
        pf: acc.pfEsiLwf.pf + (Number(record.deductions?.pf) || 0),
        esi: acc.pfEsiLwf.esi + (Number(record.deductions?.esic) || 0),
        lwf: acc.pfEsiLwf.lwf + (Number(record.deductions?.lwf) || 0)
      },
      advanceUnfPt: {
        advance: acc.advanceUnfPt.advance + (Number(record.deductions?.advDed) || 0),
        unf: acc.advanceUnfPt.unf + (Number(record.deductions?.unfDed) || 0),
        pt: acc.advanceUnfPt.pt + (Number(record.deductions?.pt) || 0)
      },
      foodDedTpa: {
        food: acc.foodDedTpa.food + (Number(record.deductions?.foodDed) || 0),
        ded: acc.foodDedTpa.ded + 0,
        tpa: acc.foodDedTpa.tpa + (Number(record.deductions?.tpaDed) || 0)
      }
    }), {
      employeeCount: 0,
      totalEBasic: 0,
      totalArrear: 0,
      totalEBasicPlusArrear: 0,
      totalGrossEarnings: 0,
      totalPF: 0,
      totalESIC: 0,
      totalLWF: 0,
      basicHRAConv: { basic: 0, hra: 0, conv: 0 },
      othGross: { oth: 0, gross: 0 },
      eBasicHRAConv: { basic: 0, hra: 0, conv: 0 },
      washOthTrans: { wash: 0, othAll: 0, trans: 0 },
      prodArrearAtt: { prod: 0, arrear: 0, att: 0 },
      foodNightSpl: { food: 0, night: 0, spl: 0 },
      pfEsiLwf: { pf: 0, esi: 0, lwf: 0 },
      advanceUnfPt: { advance: 0, unf: 0, pt: 0 },
      foodDedTpa: { food: 0, ded: 0, tpa: 0 }
    });

    // Iterate through consolidated salary records
    allRecords.forEach((record: any, index: number) => {
      if (currentRecord > 0 && currentRecord % RECORDS_PER_PAGE === 0) {
        doc.addPage();
        yPos = addPageHeader(doc);
      }

      let xPos = startX;
      const rowHeight = 20;
      const subRowHeight = rowHeight / 3;

      // Calculate total width
      const gridWidth = totalWidth;

      // Draw all vertical borders first
      let borderXPos = startX;
      Object.values(columnWidths).forEach(width => {
        doc.line(borderXPos, yPos, borderXPos, yPos + rowHeight);
        borderXPos += width;
      });
      // Draw last vertical border
      doc.line(borderXPos, yPos, borderXPos, yPos + rowHeight);

      // Draw horizontal borders
      doc.line(startX, yPos, startX + gridWidth, yPos); // Top border
      doc.line(startX, yPos + rowHeight, startX + gridWidth, yPos + rowHeight); // Bottom border

      // Sr. No.
      doc.text((index + 1).toString(), xPos + columnWidths.srNo/2, yPos + (rowHeight/2), {
        align: 'center',
        baseline: 'middle'
      });
      xPos += columnWidths.srNo;

      // Unit (for all-units-month and all-units-year)
      if (consolidationType === 'all-units-month' && columnWidths.unit) {
        doc.setFontSize(5);
        doc.text(record.unitName || '', xPos + columnWidths.unit/2, yPos + (rowHeight/2), {
          maxWidth: columnWidths.unit - 4,
          baseline: 'middle',
          align: 'center'
        });
        doc.setFontSize(7);
        xPos += columnWidths.unit;
      }

      // Month (for unit-year and all-units-year)
      if (consolidationType === 'unit-year' && columnWidths.month) {
        doc.setFontSize(5);
        doc.text(record.month || '', xPos + columnWidths.month/2, yPos + (rowHeight/2), {
          maxWidth: columnWidths.month - 4,
          baseline: 'middle',
          align: 'center'
        });
        doc.setFontSize(7);
        xPos += columnWidths.month;
      }

      // Unit and Month (for all-units-year)
      if (consolidationType === 'all-units-year') {
        if (columnWidths.unit) {
          doc.setFontSize(4);
          doc.text(record.unitName || '', xPos + columnWidths.unit/2, yPos + (rowHeight/3), {
            maxWidth: columnWidths.unit - 4,
            align: 'center'
          });
          doc.text(record.month || '', xPos + columnWidths.unit/2, yPos + (2 * rowHeight/3), {
            maxWidth: columnWidths.unit - 4,
            align: 'center'
          });
          doc.setFontSize(7);
          xPos += columnWidths.unit;
        }
        if (columnWidths.month) {
          doc.setFontSize(5);
          doc.text(record.month || '', xPos + columnWidths.month/2, yPos + (rowHeight/2), {
            maxWidth: columnWidths.month - 4,
            baseline: 'middle',
            align: 'center'
          });
          doc.setFontSize(7);
          xPos += columnWidths.month;
        }
      }

      // Unit, Month, and Year (for custom)
      if (consolidationType === 'custom') {
        if (columnWidths.unit) {
          doc.setFontSize(4);
          doc.text(record.unitName || '', xPos + columnWidths.unit/2, yPos + (rowHeight/2), {
            maxWidth: columnWidths.unit - 4,
            baseline: 'middle',
            align: 'center'
          });
          doc.setFontSize(7);
          xPos += columnWidths.unit;
        }
        if (columnWidths.month) {
          doc.setFontSize(5);
          doc.text(record.month || '', xPos + columnWidths.month/2, yPos + (rowHeight/2), {
            maxWidth: columnWidths.month - 4,
            baseline: 'middle',
            align: 'center'
          });
          doc.setFontSize(7);
          xPos += columnWidths.month;
        }
        if (columnWidths.year) {
          doc.setFontSize(5);
          doc.text(record.year?.toString() || '', xPos + columnWidths.year/2, yPos + (rowHeight/2), {
            maxWidth: columnWidths.year - 4,
            baseline: 'middle',
            align: 'center'
          });
          doc.setFontSize(7);
          xPos += columnWidths.year;
        }
      }

      // EmpID
      doc.text(record.empId || '', xPos + columnWidths.empId/2, yPos + (rowHeight/2), {
        baseline: 'middle',
        align: 'center'
      });
      xPos += columnWidths.empId;

      // Employee Name and Guardian Name (stacked)
      const nameY = yPos + (rowHeight/3);
      const guardianY = yPos + (2 * rowHeight/3);

      // Employee name on top
      doc.text(record.name || '', xPos + columnWidths.empName/2, nameY, {
        maxWidth: columnWidths.empName - 4,
        align: 'center'
      });

      // Guardian name below (with smaller font)
      const currentFontSize = doc.getFontSize();
      doc.setFontSize(5); // Smaller font for guardian name
      doc.text(record.guardianName || '', xPos + columnWidths.empName/2, guardianY, {
        maxWidth: columnWidths.empName - 4,
        align: 'center'
      });
      doc.setFontSize(currentFontSize); // Restore original font size

      xPos += columnWidths.empName;

      // ESI/Adhar/UAN Numbers (stacked)
      const identifiers = [
        record.esiNo || '',
        record.adharNo || '',
        record.uanNo || ''
      ];

      if (identifiers[0] || identifiers[1] || identifiers[2]) {
        doc.setFontSize(5);
        doc.text(identifiers[0], xPos + columnWidths.esiNo/2, yPos + (rowHeight/3), { align: 'center' });
        doc.text(identifiers[1], xPos + columnWidths.esiNo/2, yPos + (rowHeight/2), { align: 'center' });
        doc.text(identifiers[2], xPos + columnWidths.esiNo/2, yPos + (rowHeight*2/3), { align: 'center' });
        doc.setFontSize(7);
      }
      xPos += columnWidths.esiNo;

      // P.Days
      doc.text(record.payDays?.toString() || '', xPos + columnWidths.pDays/2, yPos + (rowHeight/2), {
        align: 'center',
        baseline: 'middle'
      });
      xPos += columnWidths.pDays;

      // Basic HRA Conv (stacked)
      doc.text(record.earnings?.basic?.toString() || '', xPos + columnWidths.basicHRAConv/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.earnings?.hra?.toString() || '', xPos + columnWidths.basicHRAConv/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.earnings?.conv?.toString() || '', xPos + columnWidths.basicHRAConv/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.basicHRAConv;

      // Wash/Oth.All/Trans.All (stacked)
      doc.text(record.earnings?.washAll?.toString() || '', xPos + columnWidths.washOthAllTrans/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.earnings?.othAll?.toString() || '', xPos + columnWidths.washOthAllTrans/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.earnings?.tranAll?.toString() || '', xPos + columnWidths.washOthAllTrans/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.washOthAllTrans;

      // ProdAll/Arrear/AttAwd
      doc.text(record.earnings?.prodAll?.toString() || '', xPos + columnWidths.prodAllArrear/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.earnings?.arrear?.toString() || '', xPos + columnWidths.prodAllArrear/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.earnings?.attAward?.toString() || '', xPos + columnWidths.prodAllArrear/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.prodAllArrear;

      // Food All/Night All/Spl All
      doc.text(record.earnings?.foodAll?.toString() || '', xPos + columnWidths.foodAllNight/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.earnings?.nightAll?.toString() || '', xPos + columnWidths.foodAllNight/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.earnings?.splAll?.toString() || '', xPos + columnWidths.foodAllNight/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.foodAllNight;

      // Gross Earning
      doc.text(record.earnings?.grossEarnings?.toString() || '', xPos + columnWidths.grossEarning/2, yPos + (rowHeight/2), {
        align: 'center',
        baseline: 'middle'
      });
      xPos += columnWidths.grossEarning;

      // PF/ESI/LWF (stacked)
      doc.text(record.deductions?.pf?.toString() || '', xPos + columnWidths.pfEsiLwf/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.deductions?.esic?.toString() || '', xPos + columnWidths.pfEsiLwf/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.deductions?.lwf?.toString() || '', xPos + columnWidths.pfEsiLwf/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.pfEsiLwf;

      // Advance/Unf Ded/Food Ded
      doc.text(record.deductions?.advDed?.toString() || '', xPos + columnWidths.advanceUnfPt/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.deductions?.unfDed?.toString() || '', xPos + columnWidths.advanceUnfPt/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.deductions?.foodDed?.toString() || '', xPos + columnWidths.advanceUnfPt/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.advanceUnfPt;

      // TPA Ded
      doc.text(record.deductions?.tpaDed?.toString() || '', xPos + columnWidths.foodDedTpa/2, yPos + (rowHeight/2), {
        align: 'center',
        baseline: 'middle'
      });
      xPos += columnWidths.foodDedTpa;

      // Total Ded (centered)
      doc.text(
        record.deductions?.totalDeductions?.toString() || '',
        xPos + columnWidths.totalDed/2,
        yPos + (rowHeight/2),
        {
          align: 'center',
          baseline: 'middle'
        }
      );
      xPos += columnWidths.totalDed;

      // Net Pay (centered)
      doc.text(
        record.netPayable?.toString() || '',
        xPos + columnWidths.netPay/2,
        yPos + (rowHeight/2),
        {
          align: 'center',
          baseline: 'middle'
        }
      );

      yPos += rowHeight;
      currentRecord++;
    });

    // Add Summary/Totals Page
    doc.addPage();
    doc.setFontSize(14);
    doc.text('TOTAL', doc.internal.pageSize.width / 2, 30, { align: 'center' });

    // Draw the totals summary table
    const summaryStartY = 50;
    const summaryRowHeight = 20;
    const subRowHeight = summaryRowHeight / 3;

    // Define column widths for summary (without Unit/Month/Year columns)
    const summaryColumnWidths = {
      basicHRAConv: 25,
      washOthAll: 25,
      basicHRA: 25,
      washOthAllTrans: 25,
      prodAllArrear: 25,
      foodAllNight: 25,
      grossEarning: 25,
      pfEsiLwf: 25,
      advanceUnfPt: 25,
      foodDedTpa: 25,
      totalDed: 25,
      netPay: 25
    };

    const summaryTotalWidth = Object.values(summaryColumnWidths).reduce((a, b) => a + b, 0);
    const summaryStartX = (doc.internal.pageSize.width - summaryTotalWidth) / 2;

    // Draw header
    doc.setFillColor(211, 211, 211);
    doc.rect(summaryStartX, summaryStartY, summaryTotalWidth, 15, 'F');
    
    doc.setFontSize(6);
    const summaryHeaders = [
      { text: 'Basic\nHRA\nConv.', width: summaryColumnWidths.basicHRAConv },
      { text: 'Wash\nOth.All\nGross', width: summaryColumnWidths.washOthAll },
      { text: 'eBasic\neHRA\neConv.', width: summaryColumnWidths.basicHRA },
      { text: 'Wash\nOth.All\nTrans. All.', width: summaryColumnWidths.washOthAllTrans },
      { text: 'ProdAll.\nArrear\nAttAwd', width: summaryColumnWidths.prodAllArrear },
      { text: 'Food All.\nNight All.\nSpl. All', width: summaryColumnWidths.foodAllNight },
      { text: 'Gross\nEarning', width: summaryColumnWidths.grossEarning },
      { text: 'PF\nESI\nLWF', width: summaryColumnWidths.pfEsiLwf },
      { text: 'Advance\nUnf Ded\nPT', width: summaryColumnWidths.advanceUnfPt },
      { text: 'Food\nDed\nTPA', width: summaryColumnWidths.foodDedTpa },
      { text: 'Total\nDed', width: summaryColumnWidths.totalDed },
      { text: 'Net\nPay', width: summaryColumnWidths.netPay }
    ];

    let xPos = summaryStartX;
    summaryHeaders.forEach(header => {
      doc.text(header.text, xPos + header.width/2, summaryStartY + 8, {
        align: 'center',
        maxWidth: header.width - 1
      });
      xPos += header.width;
    });

    // Draw header grid
    xPos = summaryStartX;
    doc.setDrawColor(0);
    Object.values(summaryColumnWidths).forEach(width => {
      doc.line(xPos, summaryStartY, xPos, summaryStartY + 15);
      xPos += width;
    });
    doc.line(xPos, summaryStartY, xPos, summaryStartY + 15);
    doc.line(summaryStartX, summaryStartY, xPos, summaryStartY);
    doc.line(summaryStartX, summaryStartY + 15, xPos, summaryStartY + 15);

    // Draw data
    const dataStartY = summaryStartY + 15;
    xPos = summaryStartX;

    // Calculate totals
    const grossEarning = consolidatedTotals.totalGrossEarnings;
    // Use contributions.employee.epfAC1 for PF (correct value based on basic+arrear)
    const totalDeductions = contributions.employee.epfAC1 + consolidatedTotals.pfEsiLwf.esi + 
                           consolidatedTotals.pfEsiLwf.lwf + consolidatedTotals.advanceUnfPt.advance + 
                           consolidatedTotals.advanceUnfPt.unf + consolidatedTotals.advanceUnfPt.pt + 
                           consolidatedTotals.foodDedTpa.food + consolidatedTotals.foodDedTpa.ded + 
                           consolidatedTotals.foodDedTpa.tpa;
    const netPay = grossEarning - totalDeductions;

    // Basic/HRA/Conv
    [consolidatedTotals.basicHRAConv.basic, consolidatedTotals.basicHRAConv.hra, consolidatedTotals.basicHRAConv.conv]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.basicHRAConv/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.basicHRAConv;

    // Oth/Gross
    [consolidatedTotals.othGross.oth, consolidatedTotals.othGross.gross]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.washOthAll/2, dataStartY + (index * (summaryRowHeight/2)) + 3, { align: 'center' });
      });
    xPos += summaryColumnWidths.washOthAll;

    // eBasic/eHRA/eConv
    [consolidatedTotals.eBasicHRAConv.basic, consolidatedTotals.eBasicHRAConv.hra, consolidatedTotals.eBasicHRAConv.conv]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.basicHRA/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.basicHRA;

    // Wash/Oth.All/Trans.All
    [consolidatedTotals.washOthTrans.wash, consolidatedTotals.washOthTrans.othAll, consolidatedTotals.washOthTrans.trans]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.washOthAllTrans/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.washOthAllTrans;

    // ProdAll/Arrear/AttAwd
    [consolidatedTotals.prodArrearAtt.prod, consolidatedTotals.prodArrearAtt.arrear, consolidatedTotals.prodArrearAtt.att]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.prodAllArrear/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.prodAllArrear;

    // Food/Night/Spl
    [consolidatedTotals.foodNightSpl.food, consolidatedTotals.foodNightSpl.night, consolidatedTotals.foodNightSpl.spl]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.foodAllNight/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.foodAllNight;

    // Gross Earning
    doc.text(Math.round(Number(grossEarning)).toString(), xPos + summaryColumnWidths.grossEarning/2, dataStartY + 10, { align: 'center' });
    xPos += summaryColumnWidths.grossEarning;

    // PF/ESI/LWF
    // Use contributions.employee.epfAC1 for PF (correct value based on basic+arrear)
    [contributions.employee.epfAC1, consolidatedTotals.pfEsiLwf.esi, consolidatedTotals.pfEsiLwf.lwf]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.pfEsiLwf/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.pfEsiLwf;

    // Advance/Unf/PT
    [consolidatedTotals.advanceUnfPt.advance, consolidatedTotals.advanceUnfPt.unf, consolidatedTotals.advanceUnfPt.pt]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.advanceUnfPt/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.advanceUnfPt;

    // Food/Ded/TPA
    [consolidatedTotals.foodDedTpa.food, consolidatedTotals.foodDedTpa.ded, consolidatedTotals.foodDedTpa.tpa]
      .forEach((value, index) => {
        doc.text(Math.round(Number(value)).toString(), xPos + summaryColumnWidths.foodDedTpa/2, dataStartY + (index * subRowHeight) + 5, { align: 'center' });
      });
    xPos += summaryColumnWidths.foodDedTpa;

    // Total Ded
    doc.text(Math.round(Number(totalDeductions)).toString(), xPos + summaryColumnWidths.totalDed/2, dataStartY + 10, { align: 'center' });
    xPos += summaryColumnWidths.totalDed;

    // Net Pay
    doc.text(Math.round(Number(netPay)).toString(), xPos + summaryColumnWidths.netPay/2, dataStartY + 10, { align: 'center' });

    // Draw data grid
    doc.rect(summaryStartX, dataStartY, summaryTotalWidth, summaryRowHeight);
    xPos = summaryStartX;
    Object.values(summaryColumnWidths).forEach(width => {
      doc.line(xPos, dataStartY, xPos, dataStartY + summaryRowHeight);
      xPos += width;
    });
    doc.line(xPos, dataStartY, xPos, dataStartY + summaryRowHeight);

    // Add summary information below the table
    const boxStartY = dataStartY + summaryRowHeight;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Created By:-", 20, boxStartY + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total no. of Employee                    :        ${consolidatedTotals.employeeCount}`, 20, boxStartY + 30);
    doc.text(`No. of Employee Covered under EPF    :        ${consolidatedTotals.employeeCount}`, 20, boxStartY + 35);
    doc.text(`No. of Employee Covered under EPS    :        ${consolidatedTotals.employeeCount}`, 20, boxStartY + 40);
    doc.text(`No. of Employee Covered under DLI    :        ${consolidatedTotals.employeeCount}`, 20, boxStartY + 45);
    doc.text(`No. of Employee Covered under ESI    :        ${consolidatedTotals.employeeCount}`, 20, boxStartY + 50);
    
    doc.text(`Salary/Wages for EPF                    :        ${consolidatedTotals.totalEBasicPlusArrear.toFixed(0)}`, 20, boxStartY + 55);
    doc.text(`Salary/Wages for Pension                :        ${consolidatedTotals.totalEBasicPlusArrear.toFixed(0)}`, 20, boxStartY + 60);
    doc.text(`Salary/Wages for DLI                    :        ${consolidatedTotals.totalEBasicPlusArrear.toFixed(0)}`, 20, boxStartY + 65);

    // Draw the contributions tables
    const tableStartY = boxStartY + 60;
    const tableStartX = doc.internal.pageSize.width - 150;

    // Contributions table
    doc.setLineDashPattern([1, 1], 0);
    doc.text("CONTRIBUTIONS", tableStartX, tableStartY - 50);
    doc.text("Employee's", tableStartX + 40, tableStartY - 50);
    doc.text("Employer's", tableStartX + 70, tableStartY - 50);
    doc.text("Total", tableStartX + 100, tableStartY - 50);
    doc.line(tableStartX, tableStartY - 45, tableStartX + 120, tableStartY - 45);

    let currentY = tableStartY - 40;
    // Note: contributions are already calculated above (before consolidatedTotals)
    // Using the same contributions object

    const totals = {
      epfAC1: contributions.employee.epfAC1 + contributions.employer.epfAC1,
      fpfAC10: contributions.employer.fpfAC10,
      dliAC21: contributions.employer.dliAC21,
      admPFAC2: contributions.employer.admPFAC2,
      admPFAC22: 0
    };

    doc.text("EPF A/C No. 1", tableStartX, currentY);
    doc.text(contributions.employee.epfAC1.toFixed(0), tableStartX + 40, currentY);
    doc.text(contributions.employer.epfAC1.toFixed(0), tableStartX + 70, currentY);
    doc.text(totals.epfAC1.toFixed(0), tableStartX + 100, currentY);
    
    currentY += 5;
    doc.text("FPF A/C No. 10", tableStartX, currentY);
    doc.text(contributions.employer.fpfAC10.toFixed(0), tableStartX + 70, currentY);
    doc.text(totals.fpfAC10.toFixed(0), tableStartX + 100, currentY);
    
    currentY += 5;
    doc.text("DLI A/C No. 21", tableStartX, currentY);
    doc.text(contributions.employer.dliAC21.toFixed(0), tableStartX + 70, currentY);
    doc.text(totals.dliAC21.toFixed(0), tableStartX + 100, currentY);

    currentY += 5;
    doc.text("Adm. Ch For PF A/C 2", tableStartX, currentY);
    doc.text(contributions.employer.admPFAC2.toFixed(0), tableStartX + 70, currentY);
    doc.text(totals.admPFAC2.toFixed(0), tableStartX + 100, currentY);

    currentY += 5;
    doc.text("Adm. Ch For PF A/C 22", tableStartX, currentY);
    doc.text("0", tableStartX + 70, currentY);
    doc.text("0", tableStartX + 100, currentY);

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Total", tableStartX, currentY);
    doc.text((contributions.employee.epfAC1).toFixed(0), tableStartX + 40, currentY);
    doc.text((contributions.employer.epfAC1 + contributions.employer.fpfAC10 + contributions.employer.dliAC21 + contributions.employer.admPFAC2).toFixed(0), tableStartX + 70, currentY);
    doc.text((totals.epfAC1 + totals.fpfAC10 + totals.dliAC21 + totals.admPFAC2).toFixed(0), tableStartX + 100, currentY);
    doc.setFont("helvetica", "normal");

    currentY += 15;

    // ESI Contributions
    doc.text("ESI Contributions", tableStartX, currentY);
    doc.text("Rate", tableStartX + 70, currentY);
    doc.text("Amount", tableStartX + 100, currentY);
    doc.line(tableStartX, currentY + 5, tableStartX + 120, currentY + 5);
    
    currentY += 10;
    doc.text("Employee's", tableStartX, currentY);
    doc.text("0.75", tableStartX + 70, currentY);
    doc.text(consolidatedTotals.totalESIC.toFixed(0), tableStartX + 100, currentY);

    currentY += 5;
    doc.text("Employer's", tableStartX, currentY);
    doc.text("3.25", tableStartX + 70, currentY);
    doc.text((consolidatedTotals.totalGrossEarnings * 0.0325).toFixed(0), tableStartX + 100, currentY);

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Total", tableStartX, currentY);
    doc.text((consolidatedTotals.totalGrossEarnings * 0.04).toFixed(0), tableStartX + 100, currentY);
    doc.setFont("helvetica", "normal");

    currentY += 15;

    // LWF Contributions
    doc.text("LWF Contributions", tableStartX, currentY);
    doc.text("Amount", tableStartX + 100, currentY);
    doc.line(tableStartX, currentY + 5, tableStartX + 120, currentY + 5);
    
    currentY += 15;
    doc.text("Employee's", tableStartX, currentY);
    doc.text(consolidatedTotals.totalLWF.toFixed(2), tableStartX + 100, currentY);

    currentY += 5;
    doc.text("Employer's", tableStartX, currentY);
    doc.text((consolidatedTotals.totalLWF * 2).toFixed(2), tableStartX + 100, currentY);

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Total", tableStartX, currentY);
    doc.text((consolidatedTotals.totalLWF * 3).toFixed(2), tableStartX + 100, currentY);
    doc.setFont("helvetica", "normal");

    // Convert to PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Return the PDF response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="consolidated_salary_report.pdf"'
      }
    });

  } catch (error) {
    console.error('Error generating consolidated PDF:', error);
    return new Response('Error generating consolidated PDF', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
