import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/models/Account';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get trial balance
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();
    const asOnDate = searchParams.get('asOnDate');

    // Get all active accounts
    const accounts = await Account.find({ isActive: true }).sort({ accountCode: 1 });

    // Format trial balance entries
    const trialBalanceEntries = accounts.map(account => {
      const debit = account.balanceType === 'Dr' ? account.currentBalance : 0;
      const credit = account.balanceType === 'Cr' ? account.currentBalance : 0;

      return {
        _id: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountGroup: account.accountGroup,
        accountType: account.accountType,
        debit,
        credit,
        balanceType: account.balanceType,
        balance: account.currentBalance,
      };
    });

    // Group by account group
    const groupedEntries = {
      Assets: trialBalanceEntries.filter(e => e.accountGroup === 'Assets'),
      Liabilities: trialBalanceEntries.filter(e => e.accountGroup === 'Liabilities'),
      Capital: trialBalanceEntries.filter(e => e.accountGroup === 'Capital'),
      Income: trialBalanceEntries.filter(e => e.accountGroup === 'Income'),
      Expenses: trialBalanceEntries.filter(e => e.accountGroup === 'Expenses'),
    };

    // Calculate totals
    const totalDebit = trialBalanceEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = trialBalanceEntries.reduce((sum, entry) => sum + entry.credit, 0);

    // Calculate group totals
    const groupTotals = {
      Assets: {
        debit: groupedEntries.Assets.reduce((sum, e) => sum + e.debit, 0),
        credit: groupedEntries.Assets.reduce((sum, e) => sum + e.credit, 0),
      },
      Liabilities: {
        debit: groupedEntries.Liabilities.reduce((sum, e) => sum + e.debit, 0),
        credit: groupedEntries.Liabilities.reduce((sum, e) => sum + e.credit, 0),
      },
      Capital: {
        debit: groupedEntries.Capital.reduce((sum, e) => sum + e.debit, 0),
        credit: groupedEntries.Capital.reduce((sum, e) => sum + e.credit, 0),
      },
      Income: {
        debit: groupedEntries.Income.reduce((sum, e) => sum + e.debit, 0),
        credit: groupedEntries.Income.reduce((sum, e) => sum + e.credit, 0),
      },
      Expenses: {
        debit: groupedEntries.Expenses.reduce((sum, e) => sum + e.debit, 0),
        credit: groupedEntries.Expenses.reduce((sum, e) => sum + e.credit, 0),
      },
    };

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return NextResponse.json({
      success: true,
      trialBalanceEntries,
      groupedEntries,
      groupTotals,
      summary: {
        totalAccounts: accounts.length,
        totalDebit,
        totalCredit,
        difference: totalDebit - totalCredit,
        isBalanced,
      },
      financialYear,
      asOnDate: asOnDate || new Date(),
    });
  } catch (error: any) {
    console.error('Error fetching trial balance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch trial balance' },
      { status: 500 }
    );
  }
}






















