/**
 * Accounting Utility Functions
 */

/**
 * Get the current financial year (April to March)
 * Format: "2024-25"
 */
export function getCurrentFinancialYear(): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  
  if (currentMonth >= 4) {
    // Apr to Dec - FY is current year to next year
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  } else {
    // Jan to Mar - FY is previous year to current year
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
}

/**
 * Get financial year from a specific date
 */
export function getFinancialYearFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Generate next voucher number for a given type and financial year
 * Format: "PAY/2024-25/0001", "REC/2024-25/0001", "JNL/2024-25/0001"
 */
export function generateVoucherNumber(
  voucherType: string,
  financialYear: string,
  lastNumber: number = 0
): string {
  const prefix = getVoucherPrefix(voucherType);
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `${prefix}/${financialYear}/${nextNumber}`;
}

/**
 * Get voucher prefix based on type
 */
export function getVoucherPrefix(voucherType: string): string {
  const prefixes: Record<string, string> = {
    'Payment': 'PAY',
    'Receipt': 'REC',
    'Journal': 'JNL',
    'Contra': 'CNT',
    'Sales': 'SAL',
    'Purchase': 'PUR',
    'Debit Note': 'DBN',
    'Credit Note': 'CRN',
  };
  return prefixes[voucherType] || 'VOC';
}

/**
 * Validate if debit equals credit
 */
export function validateDoubleEntry(
  debitTotal: number,
  creditTotal: number,
  tolerance: number = 0.01
): boolean {
  return Math.abs(debitTotal - creditTotal) <= tolerance;
}

/**
 * Round to 2 decimal places
 */
export function roundTo2Decimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calculate balance type based on account group and balance
 */
export function calculateBalanceType(
  accountGroup: string,
  balance: number
): 'Dr' | 'Cr' {
  // Assets and Expenses are normally Debit balance
  // Liabilities, Capital, and Income are normally Credit balance
  
  if (balance === 0) {
    // Default based on group
    if (accountGroup === 'Assets' || accountGroup === 'Expenses') {
      return 'Dr';
    } else {
      return 'Cr';
    }
  }
  
  if (accountGroup === 'Assets' || accountGroup === 'Expenses') {
    return balance >= 0 ? 'Dr' : 'Cr';
  } else {
    return balance >= 0 ? 'Cr' : 'Dr';
  }
}

/**
 * Update account balance based on transaction
 */
export function updateAccountBalance(
  currentBalance: number,
  currentBalanceType: 'Dr' | 'Cr',
  debitAmount: number,
  creditAmount: number,
  accountGroup: string
): { balance: number; balanceType: 'Dr' | 'Cr' } {
  // Convert current balance to signed number
  let signedBalance = currentBalanceType === 'Dr' ? currentBalance : -currentBalance;
  
  // For assets and expenses: Dr increases, Cr decreases
  // For liabilities, capital, income: Cr increases, Dr decreases
  if (accountGroup === 'Assets' || accountGroup === 'Expenses') {
    signedBalance += debitAmount - creditAmount;
  } else {
    signedBalance += creditAmount - debitAmount;
  }
  
  const newBalance = Math.abs(signedBalance);
  const newBalanceType = calculateBalanceType(accountGroup, signedBalance);
  
  return {
    balance: roundTo2Decimals(newBalance),
    balanceType: newBalanceType,
  };
}

/**
 * Get account groups hierarchy
 */
export function getAccountGroupsHierarchy() {
  return {
    'Assets': [
      'Current Assets',
      'Fixed Assets',
      'Bank Account',
      'Cash',
      'Sundry Debtors',
    ],
    'Liabilities': [
      'Current Liabilities',
      'Sundry Creditors',
      'Loans',
      'Provisions',
    ],
    'Income': [
      'Direct Income',
      'Indirect Income',
    ],
    'Expenses': [
      'Direct Expenses',
      'Indirect Expenses',
    ],
    'Capital': [
      'Capital Account',
    ],
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Parse financial year to start and end dates
 */
export function parseFinancialYear(fy: string): { start: Date; end: Date } {
  const [startYear] = fy.split('-');
  const start = new Date(`${startYear}-04-01`);
  const end = new Date(`${parseInt(startYear) + 1}-03-31`);
  return { start, end };
}






















