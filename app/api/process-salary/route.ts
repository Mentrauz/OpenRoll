import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const monthsConfig = {
  '1': { name: 'January', days: 31 },
  '2': { name: 'February', days: 28 }, // Will be adjusted for leap years
  '3': { name: 'March', days: 31 },
  '4': { name: 'April', days: 30 },
  '5': { name: 'May', days: 31 },
  '6': { name: 'June', days: 30 },
  '7': { name: 'July', days: 31 },
  '8': { name: 'August', days: 31 },
  '9': { name: 'September', days: 30 },
  '10': { name: 'October', days: 31 },
  '11': { name: 'November', days: 30 },
  '12': { name: 'December', days: 31 }
};

function getDaysInMonth(month: number, year: number) {
  console.log('getDaysInMonth input:', { month, year, monthType: typeof month });
  
  // Ensure month is a number and within valid range
  const monthNum = parseInt(month.toString());
  
  // Handle February for leap years
  if (monthNum === 2) {
    return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28;
  }
  
  const days = monthsConfig[monthNum].days;
  console.log(`Month ${monthNum} (${monthsConfig[monthNum].name}) has ${days} days`);
  return days;
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

export async function POST(request: Request) {
  try {
    const { unit, month, year } = await request.json();
    console.log('Processing salary for:', { unit, month, year });

    const client = await clientPromise;
    const db = client.db("Units");

    // Get all unit data from UnitsList collection
    const unitsListCollection = db.collection('UnitsList');
    const unitConfig = await unitsListCollection.findOne({ unitName: unit });

    if (!unitConfig) {
      console.error(`Failed to find unit configuration for: "${unit}"`);
      return NextResponse.json({
        success: false,
        error: `Unit configuration not found for "${unit}"`
      }, { status: 404 });
    }

    console.log('Found unit config:', unitConfig);
    console.log('Unit monthDaysType:', unitConfig.monthDaysType);
    console.log('Unit monthDays:', unitConfig.monthDays);

    // Use the monthDays from UnitsList for calculations
    let monthDays: number;
    if (unitConfig.monthDaysType === 'month') {
      monthDays = getDaysInMonth(parseInt(month), parseInt(year));
      console.log(`Using calendar days for month ${month}: ${monthDays}`);
    } else {
      monthDays = parseInt(unitConfig.monthDays) || 30;
      console.log(`Using configured custom days: ${monthDays} (from unitConfig.monthDays: ${unitConfig.monthDays})`);
    }

    // Get databases
    const employeesDb = client.db("Employees");
    const attendanceDb = client.db("Attendance");
    const processSalaryDb = client.db("ProcessSalary");

    // Get collections
    const employeeCollection = employeesDb.collection(unit.toUpperCase().replace(/ /g, '_'));
    const attendanceCollection = attendanceDb.collection(`attendance_${year}`);

    // Get attendance data for the month
    const attendanceData = await attendanceCollection.findOne({ month });
    if (!attendanceData) {
      return NextResponse.json({
        success: false,
        error: 'No attendance data found for selected month'
      });
    }

    // Get unit's attendance records using normalized name matching
    const unitAttendance = attendanceData.units.find((u: any) => 
      normalizeUnitName(u.unit) === normalizeUnitName(unit)
    );
    if (!unitAttendance) {
      console.error('No attendance records found for unit:', unit);
      console.error('Available units in attendance:', attendanceData.units.map((u: any) => u.unit));
      return NextResponse.json({
        success: false,
        error: 'No attendance records found for selected unit'
      });
    }

    console.log('Unit attendance records:', unitAttendance);

    // Process salary for each employee
    const processedSalaries = [];
    for (const attendance of unitAttendance.records) {
      const employee = await employeeCollection.findOne({ empId: attendance.EMPID });
      if (!employee) {
        console.log(`Employee not found for EMPID: ${attendance.EMPID}`);
        continue;
      }

      console.log('Processing employee:', employee.name, 'EMPID:', attendance.EMPID);
      
      // Get employee details exactly as stored in Employees database
      const employeeDetails = {
        empId: employee.empId,
        name: employee.name,
        guardianName: employee.guardianName || '',
        relation: employee.relation || '',
        dob: employee.dob || '',
        doj: employee.doj || '',
        bankAccount: employee.bankAccount || '',
        ifscCode: employee.ifscCode || '',
        esicNumber: employee.esicNumber || '',
        basic: employee.basic || '',
        hra: employee.hra || '',
        conveyance: employee.conveyance || '0',
        washingAllowance: employee.washingAllowance || '0',
        otherAllowance: employee.otherAllowance || '0',
        grossSalary: employee.grossSalary || '',
        aadharNumber: employee.aadharNumber || '',
        uanNumber: employee.uanNumber || '',
        unitName: employee.unitName || '',
        gender: employee.gender || '',
        maritalStatus: employee.maritalStatus || '',
        lwfId: employee.lwfId || '',
        mobileNumber: employee.mobileNumber || ''
      };

      // Calculate salary components
      const basicSalary = parseFloat(employee.basic) || 0;
      const hraSalary = parseFloat(employee.hra) || 0;
      const conveyanceSalary = parseFloat(employee.conveyance) || 0;
      const washingAllowance = parseFloat(employee.washingAllowance) || 0;
      const otherAllowance = parseFloat(employee.otherAllowance) || 0;
      const payDays = parseFloat(attendance['P DAY']) || 0;

      // Log calculation details
      console.log('Salary calculation:', {
        employeeId: employee.empId,
        monthDays,
        basicSalary,
        payDays,
        calculation: `${basicSalary} / ${monthDays} * ${payDays}`
      });

      // Calculate basic with explicit values
      const basic = Math.round((basicSalary / monthDays) * payDays);
      const hra = Math.round((hraSalary / monthDays) * payDays);
      const conv = Math.round((conveyanceSalary / monthDays) * payDays);
      const washAll = Math.round((washingAllowance / monthDays) * payDays);
      const othAll = Math.round((otherAllowance / monthDays) * payDays);

      console.log('Calculation details:', {
        monthDays,
        payDays,
        basicSalary,
        calculatedBasic: basic,
        formula: `${basicSalary} / ${monthDays} * ${payDays} = ${basic}`
      });

      // Ensure all attendance values are numbers with default 0
      const arrear = Number(attendance.ARREAR || 0);
      const attAward = Number(attendance['ATT. AWARD'] || 0);
      const splAll = Number(attendance['SPL. ALL'] || 0);
      const foodAll = Number(attendance['FOOD ALL'] || 0);
      const prodAll = Number(attendance['Prod.ALL'] || 0);
      const nightAll = Number(attendance['NIGHT ALL'] || 0);
      const tranAll = Number(attendance['TRAN ALL'] || 0);

      // Calculate gross earnings (actual earnings for the month)
      const grossEarnings = basic + hra + conv + washAll + othAll +
        arrear + attAward + splAll + foodAll + prodAll + nightAll + tranAll;

      // Calculate PF with wage ceiling limit of ₹15,000
      const PF_WAGE_CEILING = 15000;
      const pfBasic = basic + arrear;  // PF calculation base
      const pfableAmount = Math.min(pfBasic, PF_WAGE_CEILING);  // Apply wage ceiling
      const pf = Math.round(pfableAmount * 0.12);  // Calculate 12% of ceiling-limited amount

      console.log('PF calculation:', {
        empId: employee.empId,
        name: employee.name,
        actualBasic: pfBasic,
        pfableAmount,
        pf,
        calculation: `Min(${pfBasic}, ${PF_WAGE_CEILING}) * 0.12 = ${pf}`
      });

      // Calculate ESI with ceiling rounding
      const standardGross = parseFloat(employee.grossSalary) || 0;
      const esic = standardGross <= 21000 
        ? Math.ceil(grossEarnings * 0.0075)
        : 0;

      console.log('ESI calculation:', {
        empId: employee.empId,
        name: employee.name,
        standardGross,
        grossEarnings,
        isEligible: standardGross <= 21000,
        esiAmount: esic,
        manualCalculation: grossEarnings * 0.0075
      });

      // Calculate LWF based on unit configuration
      let lwf = 0;
      if (unitConfig.lwfOn === "Gross Earn(Salary+OT)") {
          const lwfRate = parseFloat(unitConfig.lwfRate) || 0;
          const lwfLimit = parseFloat(unitConfig.lwfLimit) || 0;
          
          if (lwfRate > 0) {
              lwf = Math.min(Math.round(grossEarnings * (lwfRate/100)), lwfLimit);
          }
      }

      // Ensure all deduction values are numbers with default 0
      const advDed = Number(attendance['ADV. DED'] || 0);
      const unfDed = Number(attendance['UNF.DED'] || 0);
      const tpaDed = Number(attendance['TPA DED'] || 0);
      const foodDed = Number(attendance['FOOD DED'] || 0);

      const totalDeductions = pf + esic + lwf + advDed + unfDed + tpaDed + foodDed;

      const netPayable = grossEarnings - totalDeductions;

      // Calculate standard rates (monthly fixed rates)
      const standardRates = {
        basic: parseFloat(employee.basic) || 0,
        hra: parseFloat(employee.hra) || 0,
        conveyance: parseFloat(employee.conveyance) || 0,
        other: parseFloat(employee.otherAllowance) || 0,
        gross: (parseFloat(employee.basic) || 0) +
               (parseFloat(employee.hra) || 0) +
               (parseFloat(employee.conveyance) || 0) +
               (parseFloat(employee.otherAllowance) || 0)
      };

      processedSalaries.push({
        ...employeeDetails, // Spread all employee details
        payDays: attendance['P DAY'],
        // Standard rates
        standard: standardRates,
        earnings: {
          basic,
          hra,
          conv,
          washAll,
          othAll,
          arrear,
          attAward,
          splAll,
          foodAll,
          prodAll,
          nightAll,
          tranAll,
          grossEarnings
        },
        deductions: {
          pf,
          esic,
          lwf,
          advDed,
          unfDed,
          tpaDed,
          foodDed,
          totalDeductions
        },
        netPayable
      });
    }

    console.log('Processed salaries:', processedSalaries);

    // For ESI Contributions table at the bottom
    let totalESIContributions = 0;
    processedSalaries.forEach(record => {
      const grossEarnings = record.earnings?.grossEarnings || 0;
      const standardGross = parseFloat(record.standard?.gross) || 0;
      
      if (standardGross <= 21000) {
        // Use the same calculation method as individual records
        totalESIContributions += Math.round(grossEarnings * 0.0075);
      }
    });

    // Now both individual ESI and total ESI contributions will use the same rounding method
    console.log('ESI Totals:', {
      sumOfIndividualESI: processedSalaries.reduce((sum, r) => sum + (r.deductions?.esic || 0), 0),
      calculatedTotalESI: totalESIContributions
    });

    // Store processed salaries with proper structure
    const salaryCollection = processSalaryDb.collection(`salary_${year}`);
    const existingDoc = await salaryCollection.findOne({ month });

    if (!existingDoc) {
      // Create new document for the month
      await salaryCollection.insertOne({
        month,
        units: [{
          unit,
          records: processedSalaries
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Use normalized name matching to find existing unit
      const unitExists = existingDoc.units?.some((u: any) => 
        normalizeUnitName(u.unit) === normalizeUnitName(unit)
      );
      
      if (!unitExists) {
        // Add new unit to existing month
        await salaryCollection.updateOne(
          { month },
          {
            $push: {
              units: {
                unit,
                records: processedSalaries
              }
            } as any,
            $set: { updatedAt: new Date() }
          }
        );
      } else {
        // Update existing unit's records - find the matching unit first
        const unitIndex = existingDoc.units.findIndex((u: any) => 
          normalizeUnitName(u.unit) === normalizeUnitName(unit)
        );
        
        await salaryCollection.updateOne(
          { month },
          {
            $set: {
              [`units.${unitIndex}.records`]: processedSalaries,
              updatedAt: new Date()
            }
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Salary processed successfully'
    });

  } catch (error) {
    console.error('Error processing salary:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process salary'
    }, { status: 500 });
  }
} 