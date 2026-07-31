import clientPromise from '@/lib/mongodb';
import type { FunctionDeclaration } from '@google/generative-ai';

// Normalize unit names for matching
const normalizeUnitName = (name: string) =>
  name
    .replace(/_/g, ' ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .replace(/\(|\)/g, '')
    .replace(/limited/i, 'ltd')
    .trim()
    .toLowerCase();

// ─── Plain executor functions ────────────────────────────────────────────────

export const toolExecutors: Record<string, (args: any) => Promise<any>> = {
  async listUnits({ search }: { search?: string }) {
    const client = await clientPromise;
    const db = client.db('Units');
    const query = search ? { unitName: { $regex: search, $options: 'i' } } : {};
    const units = await db
      .collection('UnitsList')
      .find(query)
      .project({ unitName: 1, unitNumber: 1, state: 1, district: 1, unitType: 1 })
      .toArray();
    return {
      units: units.map(u => ({
        name: u.unitName,
        number: u.unitNumber,
        state: u.state,
        district: u.district,
        type: u.unitType,
      })),
    };
  },

  async listEmployeesByUnit({ unitName, limit = 20 }: { unitName: string; limit?: number }) {
    const client = await clientPromise;
    const db = client.db('Employees');

    const formattedUnit = unitName
      .replace(/\s*LTD\.\s*\(R&D\)/i, ' LTD._(R&D)')
      .replace(/\s+/g, '_')
      .toUpperCase();

    // Verify the collection exists
    const collections = await db.listCollections({ name: formattedUnit }).toArray();
    if (collections.length === 0) {
      // Try to find a close match
      const allCols = await db.listCollections().toArray();
      const names = allCols.map(c => c.name);
      return {
        error: `No collection found for unit "${unitName}" (tried "${formattedUnit}"). Available units: ${names.join(', ')}`,
      };
    }

    const emps = await db.collection(formattedUnit).find({}).limit(limit).toArray();

    if (emps.length === 0)
      return { unit: unitName, employees: [], message: 'No employees found in this unit.' };

    return {
      unit: unitName,
      totalShown: emps.length,
      employees: emps.map(emp => ({
        empId: emp.empId,
        name: emp.name,
        dob: emp.dob,
        doj: emp.doj,
        grossSalary: emp.grossSalary,
        basic: emp.basic,
        unitName: emp.unitName,
      })),
    };
  },

  async searchEmployee({ query, unitName }: { query: string; unitName?: string }) {
    const client = await clientPromise;
    const db = client.db('Employees');
    const matchingEmployees: any[] = [];

    // Build mongo filter — empty/blank query means "all employees"
    const trimmedQuery = (query || '').trim();
    const filter =
      trimmedQuery.length > 0
        ? { $or: [{ empId: { $regex: trimmedQuery, $options: 'i' } }, { name: { $regex: trimmedQuery, $options: 'i' } }] }
        : {};

    if (unitName) {
      const formattedUnit = unitName
        .replace(/\s*LTD\.\s*\(R&D\)/i, ' LTD._(R&D)')
        .replace(/\s+/g, '_')
        .toUpperCase();

      const emps = await db.collection(formattedUnit).find(filter).limit(20).toArray();
      matchingEmployees.push(...emps);
    } else {
      const collections = await db.listCollections().toArray();
      for (const col of collections) {
        const emps = await db.collection(col.name).find(filter).limit(10).toArray();
        matchingEmployees.push(...emps);
        if (matchingEmployees.length >= 20) break;
      }
    }

    if (matchingEmployees.length === 0)
      return { error: `No employees found${trimmedQuery ? ` matching "${trimmedQuery}"` : ''}${unitName ? ` in unit "${unitName}"` : ''}` };

    return {
      count: matchingEmployees.length,
      results: matchingEmployees.map(emp => ({
        empId: emp.empId,
        name: emp.name,
        guardianName: emp.guardianName,
        dob: emp.dob,
        doj: emp.doj,
        bankAccount: emp.bankAccount,
        ifscCode: emp.ifscCode,
        esicNumber: emp.esicNumber,
        uanNumber: emp.uanNumber,
        aadharNumber: emp.aadharNumber,
        basic: emp.basic,
        hra: emp.hra,
        conveyance: emp.conveyance,
        washingAllowance: emp.washingAllowance,
        otherAllowance: emp.otherAllowance,
        grossSalary: emp.grossSalary,
        gender: emp.gender,
        unitName: emp.unitName,
      })),
    };
  },

  async getSalaryBreakdown({
    employeeId,
    unitName,
    month = '7',
    year = '2026',
  }: {
    employeeId: string;
    unitName?: string;
    month?: string;
    year?: string;
  }) {
    const client = await clientPromise;
    const salaryCollection = client.db('ProcessSalary').collection(`salary_${year}`);
    const salaryDoc = await salaryCollection.findOne({ month });
    if (!salaryDoc) return { error: `No salary data found for month ${month}/${year}` };

    let rec: any = null;
    if (unitName) {
      const unitData = salaryDoc.units?.find(
        (u: any) => normalizeUnitName(u.unit) === normalizeUnitName(unitName)
      );
      rec = unitData?.records?.find((r: any) => r.empId === employeeId);
    } else {
      for (const u of salaryDoc.units || []) {
        const r = u.records?.find(
          (r: any) =>
            r.empId === employeeId || r.name?.toLowerCase().includes(employeeId.toLowerCase())
        );
        if (r) { rec = r; break; }
      }
    }

    if (!rec) return { error: `No salary record found for "${employeeId}" in ${month}/${year}` };
    return {
      empId: rec.empId,
      name: rec.name,
      payDays: rec.payDays,
      earnings: rec.earnings,
      deductions: rec.deductions,
      netPayable: rec.netPayable,
    };
  },

  async getAttendanceData({
    employeeId,
    unitName,
    month = '7',
    year = '2026',
  }: {
    employeeId: string;
    unitName?: string;
    month?: string;
    year?: string;
  }) {
    const client = await clientPromise;
    const col = client.db('Attendance').collection(`attendance_${year}`);
    const doc = await col.findOne({ month });
    if (!doc) return { error: `No attendance data for ${month}/${year}` };

    let rec: any = null;
    if (unitName) {
      const unitData = doc.units?.find(
        (u: any) => normalizeUnitName(u.unit) === normalizeUnitName(unitName)
      );
      rec = unitData?.records?.find((r: any) => r.EMPID === employeeId);
    } else {
      for (const u of doc.units || []) {
        const r = u.records?.find(
          (r: any) =>
            r.EMPID === employeeId || r.NAME?.toLowerCase().includes(employeeId.toLowerCase())
        );
        if (r) { rec = r; break; }
      }
    }

    if (!rec) return { error: `No attendance record for "${employeeId}" in ${month}/${year}` };
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    return {
      empId: rec.EMPID,
      presentDays: rec['P DAY'] || 0,
      totalDaysInMonth: daysInMonth,
      absentDays: daysInMonth - (parseFloat(rec['P DAY']) || 0),
      arrear: rec.ARREAR || 0,
      attendanceAward: rec['ATT. AWARD'] || 0,
      specialAllowance: rec['SPL. ALL'] || 0,
      foodAllowance: rec['FOOD ALL'] || 0,
      productionAllowance: rec['Prod.ALL'] || 0,
      nightAllowance: rec['NIGHT ALL'] || 0,
      transportAllowance: rec['TRAN ALL'] || 0,
      advanceDeduction: rec['ADV. DED'] || 0,
      uniformDeduction: rec['UNF.DED'] || 0,
      tpaDeduction: rec['TPA DED'] || 0,
      foodDeduction: rec['FOOD DED'] || 0,
    };
  },

  async compareMonthlyPayroll({
    employeeId,
    unitName,
    month1 = '6',
    month2 = '7',
    year = '2026',
  }: {
    employeeId: string;
    unitName?: string;
    month1?: string;
    month2?: string;
    year?: string;
  }) {
    const client = await clientPromise;
    const col = client.db('ProcessSalary').collection(`salary_${year}`);

    const findRecord = async (month: string) => {
      const doc = await col.findOne({ month });
      if (!doc) return null;
      if (unitName) {
        const u = doc.units?.find(
          (u: any) => normalizeUnitName(u.unit) === normalizeUnitName(unitName)
        );
        return u?.records?.find(
          (r: any) =>
            r.empId === employeeId || r.name?.toLowerCase().includes(employeeId.toLowerCase())
        ) || null;
      }
      for (const u of doc.units || []) {
        const r = u.records?.find(
          (r: any) =>
            r.empId === employeeId || r.name?.toLowerCase().includes(employeeId.toLowerCase())
        );
        if (r) return r;
      }
      return null;
    };

    const [r1, r2] = await Promise.all([findRecord(month1), findRecord(month2)]);
    if (!r1 && !r2) return { error: `No salary records for "${employeeId}" in either month` };

    const diff = (obj1: any, obj2: any) => {
      const out: Record<string, any> = {};
      for (const k of Object.keys({ ...obj1, ...obj2 })) {
        const v1 = obj1?.[k] || 0, v2 = obj2?.[k] || 0;
        if (v1 !== v2) out[k] = { month1: v1, month2: v2, diff: v2 - v1 };
      }
      return out;
    };

    return {
      employee: { empId: employeeId, name: r1?.name || r2?.name },
      month1: { month: month1, payDays: r1?.payDays, grossEarnings: r1?.earnings?.grossEarnings || 0, netPayable: r1?.netPayable || 0 },
      month2: { month: month2, payDays: r2?.payDays, grossEarnings: r2?.earnings?.grossEarnings || 0, netPayable: r2?.netPayable || 0 },
      netDifference: (r2?.netPayable || 0) - (r1?.netPayable || 0),
      earningsChanges: diff(r1?.earnings, r2?.earnings),
      deductionsChanges: diff(r1?.deductions, r2?.deductions),
    };
  },
};

// ─── Gemini function declarations ────────────────────────────────────────────

export const geminiToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'listUnits',
    description: 'List all company units/branches. Use when the user asks to show, list, or view units.',
    parameters: {
      type: 'object' as any,
      properties: {
        search: { type: 'string' as any, description: 'Optional filter string for unit names' },
      },
    },
  },
  {
    name: 'listEmployeesByUnit',
    description: 'REQUIRED tool when: user asks to show/list/view employees in a unit. Examples: "show employees in Test Unit 1", "active employees in Test Unit 2", "list all employees", "employees in [any unit name]". DO NOT use searchEmployee for these queries — always use listEmployeesByUnit.',
    parameters: {
      type: 'object' as any,
      properties: {
        unitName: { type: 'string' as any, description: 'The unit/company name exactly as the user said it, e.g. "Test Unit 1"' },
        limit: { type: 'number' as any, description: 'Max employees to return. Default 20.' },
      },
      required: ['unitName'],
    },
  },
  {
    name: 'searchEmployee',
    description: 'Search for one SPECIFIC employee when the user provides a particular name or employee ID. Examples: "find employee John", "search for emp ID 101", "details of Rahul Sharma". DO NOT use this to list employees in a unit — use listEmployeesByUnit for that.',
    parameters: {
      type: 'object' as any,
      properties: {
        query: { type: 'string' as any, description: 'The specific employee name or ID to search for' },
        unitName: { type: 'string' as any, description: 'Optional: narrow search to a specific unit' },
      },
      required: ['query'],
    },
  },
  {
    name: 'getSalaryBreakdown',
    description: 'Get detailed salary breakdown (earnings, deductions, net payable) for a specific employee.',
    parameters: {
      type: 'object' as any,
      properties: {
        employeeId: { type: 'string' as any, description: 'Employee ID (empId)' },
        unitName: { type: 'string' as any, description: 'Optional unit name' },
        month: { type: 'string' as any, description: 'Month number e.g. "7" for July. Defaults to 7.' },
        year: { type: 'string' as any, description: 'Year e.g. "2026". Defaults to 2026.' },
      },
      required: ['employeeId'],
    },
  },
  {
    name: 'getAttendanceData',
    description: 'Get attendance records for an employee — present days, allowances, deductions.',
    parameters: {
      type: 'object' as any,
      properties: {
        employeeId: { type: 'string' as any, description: 'Employee ID or name' },
        unitName: { type: 'string' as any, description: 'Optional unit name' },
        month: { type: 'string' as any, description: 'Month number. Defaults to 7.' },
        year: { type: 'string' as any, description: 'Year. Defaults to 2026.' },
      },
      required: ['employeeId'],
    },
  },
  {
    name: 'compareMonthlyPayroll',
    description: 'Compare salary between two months for an employee to find why pay changed.',
    parameters: {
      type: 'object' as any,
      properties: {
        employeeId: { type: 'string' as any, description: 'Employee ID or name' },
        unitName: { type: 'string' as any, description: 'Optional unit name' },
        month1: { type: 'string' as any, description: 'First month number. Defaults to 6.' },
        month2: { type: 'string' as any, description: 'Second month number. Defaults to 7.' },
        year: { type: 'string' as any, description: 'Year. Defaults to 2026.' },
      },
      required: ['employeeId'],
    },
  },
];
