import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { MongoClient } from 'mongodb';

export async function POST(request: Request) {
  let client;
  try {
    const { unit, month, year } = await request.json();

    // Connect to MongoDB
    client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db('ProcessSalary');
    const employeesDb = client.db('Employees');
    const unitsDb = client.db('Units');
    
    // First get the unit data from UnitsList to get the proper unit name
    const unitsListCollection = unitsDb.collection('UnitsList');
    const unitConfig = await unitsListCollection.findOne({ _id: unit });

    if (!unitConfig) {
      throw new Error(`Unit configuration not found: ${unit}`);
    }

    // Get salary data
    const salaryCollection = db.collection(`salary_${year}`);

    // Convert month to match database format (remove leading zero and ensure string)
    const monthQuery = parseInt(month).toString();

    //

    const salaryData = await salaryCollection.findOne({ 
      month: monthQuery  // Use the converted month format
    });

    //

    if (!salaryData || !salaryData.units) {
      // Get all documents in the collection to debug
      const allDocs = await salaryCollection.find({}).toArray();
      
      // Throw a more descriptive error
      throw new Error(`No salary data found for ${month}/${year}. Available months: ${
        allDocs.map(doc => doc.month).join(', ')
      }`);
    }

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

    // Use normalized unit name matching
    const unitData = salaryData.units.find((u: any) =>
      normalizeUnitName(u.unit) === normalizeUnitName(unitConfig.unitName)
    );
    if (!unitData) {
      console.log('Available units in salary data:', salaryData.units.map((u: any) => u.unit));
      console.log('Looking for unit:', unitConfig.unitName);
      throw new Error(`No salary data found for unit: ${unitConfig.unitName}`);
    }

    // Use the specific unit's data for PDF generation
    const records = unitData.records;

    //

    // Fetch employee details for each record
    const updatedRecords = await Promise.all(records.map(async (record: any) => {
      //
      
      // Use the unit name from unitConfig
      let unitName = unitConfig.unitName;

      const employeeDetails = await employeesDb
        .collection(unitName)
        .findOne({ 
          empId: record.empId
        });

      //

      // Add debug logging here, where employeeDetails is in scope
      //

      // Return the updated record with corrected mapping
      return {
        ...record,
        // Try all possible variations of ESI number
        esiNo: record.esicNumber || // Try the direct esicNumber first
               record.esiNo || // Then try existing esiNo
               employeeDetails?.esicNumber || // Then try from employee details
               '', // Fallback to empty string
        
        // Try all possible variations of Aadhar number
        adharNo: record.aadharNumber ||
                 record.adharNo ||
                 employeeDetails?.aadharNumber ||
                 '',
        
        // Try all possible variations of UAN number
        uanNo: record.uanNumber ||
               record.uanNo ||
               employeeDetails?.uanNumber ||
               ''
      };
    }));

    unitData.records = updatedRecords;

    //

    //

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Define constants first
    const startX = 4;
    const startY = 37.5;
    
    // Define column widths
    const columnWidths = {
      srNo: 12,
      empId: 22,
      empName: 30,
      esiNo: 30,
      pDays: 7,
      basicHRA: 15.7,
      washOthAll: 15.7,
      basicHRAConv: 15.7,
      washOthAllTrans: 15.7,
      prodAllArrear: 15.7,
      foodAllNight: 15.7,
      grossEarning: 15.7,
      pfEsiLwf: 15.7,
      advanceUnfPt: 15.7,
      foodDedTpa: 15.7,
      totalDed: 15.7,
      netPay: 15.7
    };

    // Define headers
    const headers = [
      { text: 'Sr.No.', width: columnWidths.srNo },
      { text: 'EmpID', width: columnWidths.empId },
      { text: 'Employee Name\nGaurdian Name', width: columnWidths.empName },
      { text: 'ESI NO.\nAdhar NO.\nUAN NO.', width: columnWidths.esiNo, yOffset: -2 },
      { text: 'P. Days', width: columnWidths.pDays },
      { text: 'Basic\nHRA\nConv.', width: columnWidths.basicHRAConv, yOffset: -2 },
      { text: 'Oth\nGross', width: columnWidths.washOthAll, yOffset: -2 },
      { text: 'eBasic\neHRA\neConv.', width: columnWidths.basicHRAConv, yOffset: -2 },
      { text: 'Wash\nOth.All\nTrans. All.', width: columnWidths.washOthAllTrans, yOffset: -2 },
      { text: 'ProdAll.\nArrear\nAttAwd', width: columnWidths.prodAllArrear, yOffset: -2 },
      { text: 'Food All.\nNight All.\nSpl. All', width: columnWidths.foodAllNight, yOffset: -2 },
      { text: 'Gross\nEarning', width: columnWidths.grossEarning },
      { text: 'P F\nESI\nLWF', width: columnWidths.pfEsiLwf, yOffset: -2 },
      { text: 'Advance\nUnf Ded\nPT', width: columnWidths.advanceUnfPt, yOffset: -2 },
      { text: 'Food\nDed\nTPA', width: columnWidths.foodDedTpa, yOffset: -2 },
      { text: 'Total\nDed', width: columnWidths.totalDed },
      { text: 'Net\nPay', width: columnWidths.netPay }
    ];

    // Define column positions
    const columnPositions = {
      basic: startX + 40,
      vda: startX + 80,
      hra: startX + 120,
      conv: startX + 160,
      wash: startX + 200,
      othAll: startX + 240,
      bonus: startX + 280,
      wash2: startX + 320,
      nightAl: startX + 360,
      salArr: startX + 400,
      pfArr: startX + 440,
      attAwd: startX + 480,
      perfAll: startX + 520,
      prodAl: startX + 560,
      prodHike: startX + 600,
      leaveAll: startX + 640,
      grossSalary: startX + 680,
      // Deductions
      pf: startX + 720,
      esi: startX + 760,
      lwf: startX + 800,
      fine: startX + 840,
      food: startX + 880,
      tpa: startX + 920,
      adv: startX + 960,
      unf: startX + 1000,
      pTax: startX + 1040,
      totDed: startX + 1080,
      netSal: startX + 1120
    };

    // Create function to add header to each page
    function addPageHeader(doc: jsPDF) {
      // Add header with proper spacing
      doc.setFontSize(11);
      doc.text('TONDAK MANPOWER Services.', 8, 20);
      doc.text('FORM XIII', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(',', '');
      doc.text(currentDate, doc.internal.pageSize.width - 8, 20, { align: 'right' });

      // Company address and details
      doc.setFontSize(10);
      doc.text('FLOOR 2 SCO 19, SECTOR 23A', 8, 25);
      doc.text('[SEE RULE 76(1) (A)(i)]', doc.internal.pageSize.width / 2, 25, { align: 'center' });
      doc.text('GURUGRAM', 8, 30);
      doc.text('REGISTER OF WAGES', doc.internal.pageSize.width / 2, 30, { align: 'center' });
      doc.text('HARYANA', 8, 35);
      
      // Registration numbers
      doc.text('Comp. PF NO. -GNGGN2253798000', 8, 40);
      doc.text('Comp. ESINO. -69000696210001019', 8, 45);

      // Unit details on right side
      doc.text('Unit Name:', doc.internal.pageSize.width - 75, 40);
      doc.text(unitConfig.unitName, doc.internal.pageSize.width - 8, 40, { align: 'right' });
      doc.text('Location:', doc.internal.pageSize.width - 75, 45);
      doc.text(unitConfig.district || 'GURUGRAM', doc.internal.pageSize.width - 8, 45, { align: 'right' });

      // Add table headers
      const startY = 55;
      let xPos = startX;

      // Draw header background
      doc.setFillColor(211, 211, 211);
      const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
      doc.rect(startX, startY, totalWidth, 15, 'F');

      // Add headers
      doc.setFontSize(7);
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

    // Modified data rendering section
    let currentRecord = 0;
    const RECORDS_PER_PAGE = 6;

    // Helper function to center text in a column
    function drawCenteredText(doc: jsPDF, text: string, x: number, y: number, width: number) {
      const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
      const textX = x + (width - textWidth) / 2;
      doc.text(text.toString(), textX, y);
    }

    // Iterate through salary records from the first unit
    unitData.records.forEach((record: any, index: number) => {
      if (currentRecord > 0 && currentRecord % RECORDS_PER_PAGE === 0) {
        doc.addPage();
        yPos = addPageHeader(doc);
      }

      let xPos = startX;
      const rowHeight = 20;
      const subRowHeight = rowHeight / 3; // Height for each stacked item

      // Calculate total width once
      const gridWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);

      // Draw all vertical borders first
      let borderXPos = startX;
      Object.values(columnWidths).forEach(width => {
        doc.line(borderXPos, yPos, borderXPos, yPos + rowHeight);
        borderXPos += width;
      });
      // Draw last vertical border
      doc.line(borderXPos, yPos, borderXPos, yPos + rowHeight);

      // Draw horizontal borders for stacked data
      doc.line(startX, yPos, startX + gridWidth, yPos); // Top border
    //   doc.line(startX, yPos + subRowHeight, startX + gridWidth, yPos + subRowHeight); // First internal line
    //   doc.line(startX, yPos + (subRowHeight * 2), startX + gridWidth, yPos + (subRowHeight * 2)); // Second internal line
      doc.line(startX, yPos + rowHeight, startX + gridWidth, yPos + rowHeight); // Bottom border

      // Sr. No.
      doc.text((index + 1).toString(), xPos + columnWidths.srNo/2, yPos + (rowHeight/2), { 
        align: 'center',
        baseline: 'middle'
      });
      xPos += columnWidths.srNo;

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
      doc.setFontSize(6); // Smaller font for guardian name
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
        doc.text(identifiers[0], xPos + columnWidths.esiNo/2, yPos + (rowHeight/3), { align: 'center' });
        doc.text(identifiers[1], xPos + columnWidths.esiNo/2, yPos + (rowHeight/2), { align: 'center' });
        doc.text(identifiers[2], xPos + columnWidths.esiNo/2, yPos + (rowHeight*2/3), { align: 'center' });
      }
      xPos += columnWidths.esiNo;

      // P.Days
      doc.text(record.payDays?.toString() || '', xPos + columnWidths.pDays/2, yPos + (rowHeight/2), {
        align: 'center',
        baseline: 'middle'
      });
      xPos += columnWidths.pDays;

      // Basic HRA Conv (centered)
      doc.text(record.standard?.basic?.toString() || '', xPos + columnWidths.basicHRAConv/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.standard?.hra?.toString() || '', xPos + columnWidths.basicHRAConv/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.standard?.conv?.toString() || '', xPos + columnWidths.basicHRAConv/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.basicHRAConv;

      // Oth/Gross column (only two values, centered)
      try {
        // First value: Oth
        doc.text(
          (record.standard?.oth || 0).toFixed(2),
          xPos + (columnWidths.washOthAll/2),
          yPos + (rowHeight/3),
          { align: 'center' }
        );
        
        // Second value: Gross
        doc.text(
          (record.standard?.gross || 0).toFixed(2),
          xPos + (columnWidths.washOthAll/2),
          yPos + (2 * rowHeight/3),
          { align: 'center' }
        );
      } catch (error) {
        console.error('Error adding Oth/Gross text:', error);
      }
      xPos += columnWidths.washOthAll;

      // Basic/HRA/Conv (centered)
      doc.text(record.earnings?.basic?.toString() || '', xPos + columnWidths.basicHRA/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.earnings?.hra?.toString() || '', xPos + columnWidths.basicHRA/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      doc.text(record.earnings?.conv?.toString() || '', xPos + columnWidths.basicHRA/2, yPos + (rowHeight*2/3), {
        align: 'center'
      });
      xPos += columnWidths.basicHRA;

      // Wash/Oth.All/Trans.All (centered)
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

      // PF/ESI/LWF (centered)
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

      // Advance/Unf Ded/PT
      doc.text(record.deductions?.advDed?.toString() || '', xPos + columnWidths.advanceUnfPt/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.deductions?.unfDed?.toString() || '', xPos + columnWidths.advanceUnfPt/2, yPos + (rowHeight/2), {
        align: 'center'
      });
      xPos += columnWidths.advanceUnfPt;

      // Food/Ded/TPA
      doc.text(record.deductions?.foodDed?.toString() || '', xPos + columnWidths.foodDedTpa/2, yPos + (rowHeight/3), {
        align: 'center'
      });
      doc.text(record.deductions?.tpaDed?.toString() || '', xPos + columnWidths.foodDedTpa/2, yPos + (rowHeight/2), {
        align: 'center'
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

      // Draw row borders (using the same gridWidth)
      doc.line(startX, yPos + rowHeight, startX + gridWidth, yPos + rowHeight);

      yPos += rowHeight;
      currentRecord++;
    });

    // After rendering all records but before generating PDF buffer
    if (unitData.records.length > 0) {
      // Add a new page for summary
      doc.addPage();
      let yPos = 20;

      // Add "TOTAL" header centered
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += 15;

      // Define column widths (adjusted without the first 5 columns)
      const columnWidths = {
        basicHRA: 25,        // Increased width
        washOthAll: 25,      // Increased width
        basicHRAConv: 25,    // Increased width
        washOthAllTrans: 25, // Increased width
        prodAllArrear: 25,   // Increased width
        foodAllNight: 25,    // Increased width
        grossEarning: 25,    // Increased width
        pfEsiLwf: 20,       // Increased width
        advanceUnfPt: 20,    // Increased width
        foodDedTpa: 25,      // Increased width
        totalDed: 25,        // Increased width
        netPay: 25          // Increased width
      };

      // Define headers (without the first 5 columns)
      const headers = [
        { text: 'Basic\nHRA\nConv.', width: columnWidths.basicHRA },
        { text: 'Wash\nOth.All\nGross', width: columnWidths.washOthAll },
        { text: 'eBasic\neHRA\neConv.', width: columnWidths.basicHRAConv },
        { text: 'Wash\nOth.All\nTrans. All.', width: columnWidths.washOthAllTrans },
        { text: 'ProdAll.\nArrear\nAttAwd', width: columnWidths.prodAllArrear },
        { text: 'Food All.\nNight All.\nSpl. All', width: columnWidths.foodAllNight },
        { text: 'Gross\nEarning', width: columnWidths.grossEarning },
        { text: 'PF\nESI\nLWF', width: columnWidths.pfEsiLwf },
        { text: 'Advance\nUnf Ded\nPT', width: columnWidths.advanceUnfPt },
        { text: 'Food\nDed\nTPA', width: columnWidths.foodDedTpa },
        { text: 'Total\nDed', width: columnWidths.totalDed },
        { text: 'Net\nPay', width: columnWidths.netPay }
      ];

      // Draw table header
      let xPos = startX;
      const headerY = yPos;
      
      // Draw header background
      doc.setFillColor(211, 211, 211);
      const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
      doc.rect(startX, headerY, totalWidth, 15, 'F');

      // Add headers
      doc.setFontSize(7);
      headers.forEach(header => {
        doc.text(header.text, xPos + header.width/2, headerY + 8, {
          align: 'center',
          maxWidth: header.width - 1
        });
        xPos += header.width;
      });

      // Draw grid for header
      xPos = startX;
      doc.setDrawColor(0);
      
      // Vertical lines
      headers.forEach(header => {
        doc.line(xPos, headerY, xPos, headerY + 15);
        xPos += header.width;
      });
      doc.line(xPos, headerY, xPos, headerY + 15);
      
      // Horizontal lines
      doc.line(startX, headerY, xPos, headerY);
      doc.line(startX, headerY + 15, xPos, headerY + 15);

      // Calculate total earned basic + arrear for EPF contributions (BEFORE stackedTotals)
      const totalEarnedBasicPlusArrearForContrib = unitData.records.reduce((sum, record) => 
        sum + Number(record.earnings?.basic || 0) + Number(record.earnings?.arrear || 0), 0);

      // Calculate EPF contributions based on (basic + arrear) - this is the CORRECT value
      const contributions = {
        employee: {
          epfAC1: totalEarnedBasicPlusArrearForContrib * 0.12,    // Employee EPF is 12% of (basic + arrear)
        },
        employer: {
          epfAC1: totalEarnedBasicPlusArrearForContrib * 0.0367,    // 3.67% of (basic + arrear)
          fpfAC10: totalEarnedBasicPlusArrearForContrib * 0.0833,   // 8.33% of (basic + arrear)
          dliAC21: totalEarnedBasicPlusArrearForContrib * 0.005,    // 0.5% of (basic + arrear)
          admPFAC2: totalEarnedBasicPlusArrearForContrib * 0.005,   // 0.5% of (basic + arrear)
          admPFAC22: 0                          // Always 0
        }
      };

      // Calculate stacked totals from all records
      const stackedTotals = unitData.records.reduce((acc: any, record: any) => ({
        basicHRAConv: {
          basic: (acc.basicHRAConv?.basic || 0) + Number(record.standard?.basic || 0),
          hra: (acc.basicHRAConv?.hra || 0) + Number(record.standard?.hra || 0),
          conv: (acc.basicHRAConv?.conv || 0) + Number(record.standard?.conveyance || 0)
        },
        othGross: {
          oth: (acc.othGross?.oth || 0) + Number(record.standard?.oth || 0),
          gross: (acc.othGross?.gross || 0) + Number(record.standard?.gross || 0)
        },
        eBasicHRAConv: {
          basic: (acc.eBasicHRAConv?.basic || 0) + Number(record.earnings?.basic || 0),
          hra: (acc.eBasicHRAConv?.hra || 0) + Number(record.earnings?.hra || 0),
          conv: (acc.eBasicHRAConv?.conv || 0) + Number(record.earnings?.conv || 0)
        },
        washOthTrans: {
          wash: (acc.washOthTrans?.wash || 0) + Number(record.earnings?.washAll || 0),
          othAll: (acc.washOthTrans?.othAll || 0) + Number(record.earnings?.othAll || 0),
          trans: (acc.washOthTrans?.trans || 0) + Number(record.earnings?.tranAll || 0)
        },
        prodArrearAtt: {
          prod: (acc.prodArrearAtt?.prod || 0) + Number(record.earnings?.prodAll || 0),
          arrear: (acc.prodArrearAtt?.arrear || 0) + Number(record.earnings?.arrear || 0),
          att: (acc.prodArrearAtt?.att || 0) + Number(record.earnings?.attAward || 0)
        },
        foodNightSpl: {
          food: (acc.foodNightSpl?.food || 0) + Number(record.earnings?.foodAll || 0),
          night: (acc.foodNightSpl?.night || 0) + Number(record.earnings?.nightAll || 0),
          spl: (acc.foodNightSpl?.spl || 0) + Number(record.earnings?.splAll || 0)
        },
        pfEsiLwf: {
          pf: (acc.pfEsiLwf?.pf || 0) + Number(record.deductions?.pf || 0),
          esi: (acc.pfEsiLwf?.esi || 0) + Number(record.deductions?.esic || 0),
          lwf: (acc.pfEsiLwf?.lwf || 0) + Number(record.deductions?.lwf || 0)
        },
        advanceUnfPt: {
          advance: (acc.advanceUnfPt?.advance || 0) + Number(record.deductions?.advDed || 0),
          unf: (acc.advanceUnfPt?.unf || 0) + Number(record.deductions?.unfDed || 0),
          pt: (acc.advanceUnfPt?.pt || 0) + Number(record.deductions?.pt || 0)
        },
        foodDedTpa: {
          food: (acc.foodDedTpa?.food || 0) + Number(record.deductions?.foodDed || 0),
          ded: (acc.foodDedTpa?.ded || 0) + Number(record.deductions?.ded || 0),
          tpa: (acc.foodDedTpa?.tpa || 0) + Number(record.deductions?.tpaDed || 0)
        }
      }), {});

      //

      // Define constants for summary layout
      const summaryRowHeight = 20; // Height for each row in summary
      const subRowHeight = summaryRowHeight / 3; // Height for each stacked item
      const dataStartY = startY + 15; // Start after the header

      // Reset xPos for summary layout
      xPos = startX;

      // First column: Basic/HRA/Conv
      const basicHraConvValues = [
        stackedTotals.basicHRAConv.basic || 0,
        stackedTotals.basicHRAConv.hra || 0,
        stackedTotals.basicHRAConv.conv || 0
      ].map(value => Math.round(Number(value)).toString());

      basicHraConvValues.forEach((value, index) => {
        doc.text(
          value,
          xPos + columnWidths.basicHRAConv/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.basicHRAConv;

      // Second column: Oth.All/Gross only
      const othGrossValues = [
        stackedTotals.othGross?.oth || 0,     // First value
        stackedTotals.othGross?.gross || 0    // Second value
      ];

      // Calculate positions for two values only
      const spacing = summaryRowHeight / 2;  // Adjust spacing for two values
      othGrossValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.washOthAll/2,
          dataStartY + (index * spacing),  // Adjusted spacing
          { align: 'center' }
        );
      });
      xPos += columnWidths.washOthAll;

      // Third column: eBasic/eHRA/eConv
      const eBasicValues = [
        stackedTotals.eBasicHRAConv.basic || 0,
        stackedTotals.eBasicHRAConv.hra || 0,
        stackedTotals.eBasicHRAConv.conv || 0
      ];
      eBasicValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.basicHRA/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.basicHRA;

      // Fourth column: Wash/Oth.All/Trans.All
      const washOthTransValues = [
        stackedTotals.washOthTrans.wash || 0,
        stackedTotals.washOthTrans.othAll || 0,
        stackedTotals.washOthTrans.trans || 0
      ];
      washOthTransValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.washOthAllTrans/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.washOthAllTrans;

      // Fifth column: ProdAll/Arrear/AttAwd
      const prodArrearValues = [
        stackedTotals.prodArrearAtt.prod || 0,
        stackedTotals.prodArrearAtt.arrear || 0,
        stackedTotals.prodArrearAtt.att || 0
      ];
      prodArrearValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.prodAllArrear/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.prodAllArrear;

      // Sixth column: Food All/Night All/Spl All
      const foodNightValues = [
        stackedTotals.foodNightSpl.food || 0,
        stackedTotals.foodNightSpl.night || 0,
        stackedTotals.foodNightSpl.spl || 0
      ];
      foodNightValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.foodAllNight/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.foodAllNight;

      // Calculate Gross Earnings (sum of all earnings)
      const grossEarning = 
        (stackedTotals.eBasicHRAConv.basic || 0) +
        (stackedTotals.eBasicHRAConv.hra || 0) +
        (stackedTotals.eBasicHRAConv.conv || 0) +
        (stackedTotals.washOthTrans.wash || 0) +
        (stackedTotals.washOthTrans.othAll || 0) +
        (stackedTotals.washOthTrans.trans || 0) +
        (stackedTotals.prodArrearAtt.prod || 0) +
        (stackedTotals.prodArrearAtt.arrear || 0) +
        (stackedTotals.prodArrearAtt.att || 0) +
        (stackedTotals.foodNightSpl.food || 0) +
        (stackedTotals.foodNightSpl.night || 0) +
        (stackedTotals.foodNightSpl.spl || 0);

      // Calculate Total Deductions (sum of all deductions)
      // Use contributions.employee.epfAC1 for PF instead of stackedTotals
      const totalDeductions = 
        (contributions.employee.epfAC1 || 0) +  // Use calculated EPF contribution
        (stackedTotals.pfEsiLwf.esi || 0) +
        (stackedTotals.pfEsiLwf.lwf || 0) +
        (stackedTotals.advanceUnfPt.advance || 0) +
        (stackedTotals.advanceUnfPt.unf || 0) +
        (stackedTotals.advanceUnfPt.pt || 0) +
        (stackedTotals.foodDedTpa.food || 0) +
        (stackedTotals.foodDedTpa.ded || 0) +
        (stackedTotals.foodDedTpa.tpa || 0);

      // Calculate Net Pay (Gross Earnings - Total Deductions)
      const netPay = grossEarning - totalDeductions;

      // Seventh column: Gross Earning (single value)
      doc.text(
        Math.round(Number(grossEarning)).toString(),
        xPos + columnWidths.grossEarning/2,
        dataStartY + subRowHeight,
        { align: 'center' }
      );
      xPos += columnWidths.grossEarning;

      // Eighth column: PF/ESI/LWF
      // Use contributions.employee.epfAC1 for PF (correct value based on basic+arrear)
      const pfEsiValues = [
        contributions.employee.epfAC1 || 0,  // Use calculated EPF contribution
        stackedTotals.pfEsiLwf.esi || 0,
        stackedTotals.pfEsiLwf.lwf || 0
      ];
      pfEsiValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.pfEsiLwf/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.pfEsiLwf;

      // Ninth column: Advance/Unf Ded/PT
      const advanceUnfValues = [
        stackedTotals.advanceUnfPt.advance || 0,
        stackedTotals.advanceUnfPt.unf || 0,
        stackedTotals.advanceUnfPt.pt || 0
      ];
      advanceUnfValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.advanceUnfPt/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.advanceUnfPt;

      // Tenth column: Food/Ded/TPA
      const foodDedValues = [
        stackedTotals.foodDedTpa.food || 0,
        stackedTotals.foodDedTpa.ded || 0,
        stackedTotals.foodDedTpa.tpa || 0
      ];
      foodDedValues.forEach((value, index) => {
        doc.text(
          Math.round(Number(value)).toString(),
          xPos + columnWidths.foodDedTpa/2,
          dataStartY + (index * subRowHeight),
          { align: 'center' }
        );
      });
      xPos += columnWidths.foodDedTpa;

      // Eleventh column: Total Ded (single value)
      doc.text(
        Math.round(Number(totalDeductions)).toString(),
        xPos + columnWidths.totalDed/2, // Position from right edge
        dataStartY + (subRowHeight * 1.5), // Adjust vertical position
        { 
          align: 'right' // Right align the text
        }
      );
      xPos += columnWidths.totalDed;

      // Twelfth column: Net Pay (single value)
      doc.text(
        Math.round(Number(netPay)).toString(),
        xPos + columnWidths.netPay/2, // Position from right edge
        dataStartY + (subRowHeight * 1.5), // Adjust vertical position
        { 
          align: 'right' // Right align the text
        }
      );

      // Calculate total grid width
      const gridWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);

      // Draw the box for values - moved up to align with the existing values
      const boxStartY = dataStartY - 2.5; // Adjusted Y position to match where the values are
      const boxHeight = 25;
      
      // Draw box borders
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);

      // Draw horizontal lines
      doc.line(startX, boxStartY, startX + gridWidth, boxStartY); // Top
      doc.line(startX, boxStartY + boxHeight, startX + gridWidth, boxStartY + boxHeight); // Bottom

      // Draw vertical lines
      let currentX = startX;
      Object.values(columnWidths).forEach(width => {
        doc.line(currentX, boxStartY, currentX, boxStartY + boxHeight);
        currentX += width;
      });
      // Final vertical line
      doc.line(currentX, boxStartY, currentX, boxStartY + boxHeight);

      // Add the values inside the boxes
      xPos = startX;
      const valueY = boxStartY + (boxHeight/2) + 5;

      // Calculate total number of employees from the records
      const totalEmployees = unitData.records.length;

      // Calculate total eBasic + arrear value for EPF calculations
      const totalEBasicPlusArrear = unitData.records.reduce((sum, record) => 
        sum + Number(record.earnings?.basic || 0) + Number(record.earnings?.arrear || 0), 0);

      // After drawing the table and values, add the summary text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Created By:-", 20, boxStartY + boxHeight + 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Total no. of Employee                    :        ${totalEmployees}`, 20, boxStartY + boxHeight + 30);
      doc.text(`No. of Employee Covered under EPF    :        ${totalEmployees}`, 20, boxStartY + boxHeight + 35);
      doc.text(`No. of Employee Covered under EPS    :        ${totalEmployees}`, 20, boxStartY + boxHeight + 40);
      doc.text(`No. of Employee Covered under DLI    :        ${totalEmployees}`, 20, boxStartY + boxHeight + 45);
      doc.text(`No. of Employee Covered under ESI    :        ${totalEmployees}`, 20, boxStartY + boxHeight + 50);
      
      doc.text(`Salary/Wages for EPF                    :        ${totalEBasicPlusArrear.toFixed(0)}`, 20, boxStartY + boxHeight + 55);
      doc.text(`Salary/Wages for Pension                :        ${totalEBasicPlusArrear.toFixed(0)}`, 20, boxStartY + boxHeight + 60);
      doc.text(`Salary/Wages for DLI                    :        ${totalEBasicPlusArrear.toFixed(0)}`, 20, boxStartY + boxHeight + 65);

      // Draw the contributions tables
      const tableStartY = boxStartY + boxHeight + 60;
      const tableStartX = doc.internal.pageSize.width - 150; // Moved from -190 to -150 to avoid overlap

      // Draw table headers with dotted lines
      doc.setLineDashPattern([1, 1], 0); // Create dotted line
      doc.text("CONTRIBUTIONS", tableStartX, tableStartY -50);
      doc.text("Employee's", tableStartX + 40, tableStartY -50);
      doc.text("Employer's", tableStartX + 70, tableStartY -50);
      doc.text("Total", tableStartX + 100, tableStartY -50);

      // Draw horizontal dotted line
      doc.line(tableStartX, tableStartY -45, tableStartX + 120, tableStartY - 45);

      // Add contribution rows
      let currentY = tableStartY - 40;
      doc.setFont("helvetica", "normal");
      
      // Note: contributions are already calculated above (before stackedTotals)
      // Using the same contributions object

      // Calculate totals
      const totals = {
        epfAC1: contributions.employee.epfAC1 + contributions.employer.epfAC1,
        fpfAC10: contributions.employer.fpfAC10,
        dliAC21: contributions.employer.dliAC21,
        admPFAC2: contributions.employer.admPFAC2,
        admPFAC22: 0
      };

      // Calculate column totals
      const columnTotals = {
        employee: contributions.employee.epfAC1, // Only EPF for employee
        employer: contributions.employer.epfAC1 + 
                 contributions.employer.fpfAC10 + 
                 contributions.employer.dliAC21 + 
                 contributions.employer.admPFAC2 + 
                 contributions.employer.admPFAC22,
        total: totals.epfAC1 + totals.fpfAC10 + totals.dliAC21 + totals.admPFAC2 + totals.admPFAC22
      };

      // EPF A/C No. 1
      doc.text("EPF A/C No. 1", tableStartX, currentY);
      doc.text(contributions.employee.epfAC1.toFixed(0), tableStartX + 40, currentY);
      doc.text(contributions.employer.epfAC1.toFixed(0), tableStartX + 70, currentY);
      doc.text(totals.epfAC1.toFixed(0), tableStartX + 100, currentY);
      
      currentY += 5;
      // FPF A/C No. 10
      doc.text("FPF A/C No. 10", tableStartX, currentY);
      doc.text(contributions.employer.fpfAC10.toFixed(0), tableStartX + 70, currentY);
      doc.text(totals.fpfAC10.toFixed(0), tableStartX + 100, currentY);
      
      currentY += 5;
      // DLI A/C No. 21
      doc.text("DLI A/C No. 21", tableStartX, currentY);
      doc.text(contributions.employer.dliAC21.toFixed(0), tableStartX + 70, currentY);
      doc.text(totals.dliAC21.toFixed(0), tableStartX + 100, currentY);

      currentY += 5;
      // Adm. Ch For PF A/C 2
      doc.text("Adm. Ch For PF A/C 2", tableStartX, currentY);
      doc.text(contributions.employer.admPFAC2.toFixed(0), tableStartX + 70, currentY);
      doc.text(totals.admPFAC2.toFixed(0), tableStartX + 100, currentY);

      currentY += 5;
      // Adm. Ch For PF A/C 22
      doc.text("Adm. Ch For PF A/C 22", tableStartX, currentY);
      doc.text(contributions.employer.admPFAC22.toFixed(0), tableStartX + 70, currentY);
      doc.text(totals.admPFAC22.toFixed(0), tableStartX + 100, currentY);

      // Add column totals at the bottom
      currentY += 5; // Add some extra space
      doc.setFont("helvetica", "bold");
      doc.text("Total", tableStartX, currentY);
      doc.text(columnTotals.employee.toFixed(0), tableStartX + 40, currentY);
      doc.text(columnTotals.employer.toFixed(0), tableStartX + 70, currentY);
      doc.text(columnTotals.total.toFixed(0), tableStartX + 100, currentY);
      doc.setFont("helvetica", "normal"); // Reset font back to normal

      // After CONTRIBUTIONS section...
      currentY += 15; // Add space after CONTRIBUTIONS

      // ESI Contributions section
      doc.text("ESI Contributions", tableStartX, currentY);
      doc.text("Rate", tableStartX + 70, currentY);
      doc.text("Amount", tableStartX + 100, currentY);
      
      // Draw dotted line
      doc.setLineDashPattern([1, 1], 0);
      doc.line(tableStartX, currentY + 5, tableStartX + 160, currentY + 5);
      
      currentY += 10;
      // Calculate ESI contributions
      const totalESIContributions = unitData.records.reduce((sum, record) => {
        const standardGross = record.standard?.gross || 0;
        const grossEarnings = record.earnings?.grossEarnings || 0;
        
        // Use Math.ceil to match process-salary calculation
        if (standardGross <= 21000) {
          return sum + Math.ceil(grossEarnings * 0.0075);  // Changed to Math.ceil
        }
        return sum;
      }, 0);

      //

      // In the ESI Contributions section
      currentY += 0;
      // Employee's ESI
      doc.text("Employee's", tableStartX, currentY);
      doc.text("0.75", tableStartX + 70, currentY);
      doc.text(totalESIContributions.toString(), tableStartX + 100, currentY);

      currentY += 5;
      // Employer's ESI
      doc.text("Employer's", tableStartX, currentY);
      doc.text("3.25", tableStartX + 70, currentY);
      doc.text((grossEarning * 0.0325).toFixed(0), tableStartX + 100, currentY);

      currentY += 5;
      // ESI Total (in bold)
      doc.setFont("helvetica", "bold");
      doc.text("Total", tableStartX, currentY);
      doc.text((grossEarning * 0.04).toFixed(0), tableStartX + 100, currentY);
      doc.setFont("helvetica", "normal"); // Reset font back to normal

      currentY += 15; // Add space before LWF section

      // LWF Contributions section
      doc.text("LWF Contributions", tableStartX, currentY);
      doc.text("Amount", tableStartX + 100, currentY);
      
      // Draw dotted line
      doc.setLineDashPattern([1, 1], 0);
      doc.line(tableStartX, currentY + 5, tableStartX + 160, currentY + 5);
      
      currentY += 15;
      // Employee's LWF (using existing LWF value)
      const employeeLWF = stackedTotals.pfEsiLwf.lwf || 0;
      doc.text("Employee's", tableStartX, currentY);
      doc.text(employeeLWF.toFixed(2), tableStartX + 100, currentY);

      currentY += 5;
      // Employer's LWF (double of employee's)
      const employerLWF = employeeLWF * 2;
      doc.text("Employer's", tableStartX, currentY);
      doc.text(employerLWF.toFixed(2), tableStartX + 100, currentY);

      currentY += 5;
      // LWF Total (in bold)
      doc.setFont("helvetica", "bold");
      doc.text("Total", tableStartX, currentY);
      doc.text((employeeLWF + employerLWF).toFixed(2), tableStartX + 100, currentY);
      doc.setFont("helvetica", "normal"); // Reset font back to normal
    }

    // Convert to PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Return the PDF response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="salary-slip.pdf"'
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response('Error generating PDF', { 
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