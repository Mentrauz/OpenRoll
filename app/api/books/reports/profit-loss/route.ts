import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/models/Account';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get Profit & Loss statement
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Get all income accounts
    const incomeAccounts = await Account.find({ 
      accountGroup: 'Income', 
      isActive: true 
    }).sort({ accountCode: 1 });

    // Get all expense accounts
    const expenseAccounts = await Account.find({ 
      accountGroup: 'Expenses', 
      isActive: true 
    }).sort({ accountCode: 1 });

    // Group income accounts by type
    const incomeByType: any = {};
    incomeAccounts.forEach(acc => {
      if (!incomeByType[acc.accountType]) {
        incomeByType[acc.accountType] = [];
      }
      incomeByType[acc.accountType].push({
        _id: acc._id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        balance: acc.currentBalance,
        balanceType: acc.balanceType,
      });
    });

    // Group expense accounts by type
    const expensesByType: any = {};
    expenseAccounts.forEach(acc => {
      if (!expensesByType[acc.accountType]) {
        expensesByType[acc.accountType] = [];
      }
      expensesByType[acc.accountType].push({
        _id: acc._id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        balance: acc.currentBalance,
        balanceType: acc.balanceType,
      });
    });

    // Calculate totals
    const totalIncome = incomeAccounts.reduce((sum, acc) => {
      // Income accounts have credit balance normally
      const amount = acc.balanceType === 'Cr' ? acc.currentBalance : -acc.currentBalance;
      return sum + amount;
    }, 0);

    const totalExpenses = expenseAccounts.reduce((sum, acc) => {
      // Expense accounts have debit balance normally
      const amount = acc.balanceType === 'Dr' ? acc.currentBalance : -acc.currentBalance;
      return sum + amount;
    }, 0);

    // Calculate profit or loss
    const netResult = totalIncome - totalExpenses;
    const isProfit = netResult >= 0;

    // Calculate type-wise totals for income
    const incomeTypeTotals: any = {};
    Object.keys(incomeByType).forEach(type => {
      incomeTypeTotals[type] = incomeByType[type].reduce((sum: number, acc: any) => {
        const amount = acc.balanceType === 'Cr' ? acc.balance : -acc.balance;
        return sum + amount;
      }, 0);
    });

    // Calculate type-wise totals for expenses
    const expenseTypeTotals: any = {};
    Object.keys(expensesByType).forEach(type => {
      expenseTypeTotals[type] = expensesByType[type].reduce((sum: number, acc: any) => {
        const amount = acc.balanceType === 'Dr' ? acc.balance : -acc.balance;
        return sum + amount;
      }, 0);
    });

    return NextResponse.json({
      success: true,
      incomeAccounts: incomeByType,
      expenseAccounts: expensesByType,
      incomeTypeTotals,
      expenseTypeTotals,
      summary: {
        totalIncome,
        totalExpenses,
        netResult: Math.abs(netResult),
        isProfit,
        profitPercentage: totalIncome > 0 ? ((netResult / totalIncome) * 100) : 0,
      },
      financialYear,
      fromDate: fromDate || new Date(new Date().getFullYear(), 3, 1),
      toDate: toDate || new Date(),
    });
  } catch (error: any) {
    console.error('Error fetching profit & loss:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch profit & loss' },
      { status: 500 }
    );
  }
}






















