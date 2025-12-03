export interface EmployeeDetails {
  empId: string;
  name: string;
  guardianName?: string;
  relation?: string;
  dob?: string;
  doj?: string | Date;
  bankAccount?: string;
  ifscCode?: string;
  esicNumber?: string;
  aadharNumber?: string;
  uanNumber?: string;
  unitName?: string;
  gender?: string;
  maritalStatus?: string;
  lwfId?: string;
  mobileNumber?: string;
  basic?: string | number;
  hra?: string | number;
  conveyance?: string | number;
  washingAllowance?: string | number;
  otherAllowance?: string | number;
  grossSalary?: string | number;
}

export interface StandardRates {
  basic: number;
  hra: number;
  conveyance: number;
  oth: number;
  gross: number;
}

export interface Earnings {
  basic: number;
  hra: number;
  conv: number;
  washAll: number;
  othAll: number;
  arrear: number;
  attAward: number;
  splAll: number;
  foodAll: number;
  prodAll: number;
  nightAll: number;
  tranAll: number;
  grossEarnings: number;
}

export interface Deductions {
  pf: number;
  esic: number;
  lwf: number;
  advDed: number;
  unfDed: number;
  pt: number;
  foodDed: number;
  tpaDed: number;
  totalDeductions: number;
}

export interface UnitConfig {
  _id: string;
  unitName: string;
  monthDaysType: 'month' | 'specific';
  monthDays: number;
  lwfOn: string;
  lwfRate: number;
  lwfLimit: number;
  district?: string;
}

export interface SalaryCalculation {
  // Employee Details
  empId: string;
  name: string;
  guardianName?: string;
  relation?: string;
  dob?: string;
  doj?: string;
  bankAccount?: string;
  ifscCode?: string;
  esicNumber?: string;
  aadharNumber?: string;
  uanNumber?: string;
  unitName?: string;
  gender?: string;
  maritalStatus?: string;
  lwfId?: string;
  mobileNumber?: string;
  
  // Pay Information
  payDays: number;
  
  // Standard Monthly Rates
  standard: StandardRates;
  
  // Calculated Earnings
  earnings: Earnings;
  
  // Calculated Deductions
  deductions: Deductions;
  
  // Final Amount
  netPayable: number;
}

export interface ProcessedSalaryData {
  month: string;
  units: Array<{
    unit: string;
    records: SalaryCalculation[];
  }>;
  createdAt: Date;
  updatedAt: Date;
} 