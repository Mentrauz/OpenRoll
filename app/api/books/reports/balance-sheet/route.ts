import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/models/Account';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get Balance Sheet
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();
    const asOnDate = searchParams.get('asOnDate') || new Date().toISOString().split('T')[0];

    // Get all accounts grouped by their type
    const assetAccounts = await Account.find({ 
      accountGroup: 'Assets', 
      isActive: true 
    }).sort({ accountCode: 1 });

    const liabilityAccounts = await Account.find({ 
      accountGroup: 'Liabilities', 
      isActive: true 
    }).sort({ accountCode: 1 });

    const capitalAccounts = await Account.find({ 
      accountGroup: 'Capital', 
      isActive: true 
    }).sort({ accountCode: 1 });

    // Get income and expense accounts to calculate profit/loss
    const incomeAccounts = await Account.find({ 
      accountGroup: 'Income', 
      isActive: true 
    });

    const expenseAccounts = await Account.find({ 
      accountGroup: 'Expenses', 
      isActive: true 
    });

    // Calculate profit/loss
    const totalIncome = incomeAccounts.reduce((sum, acc) => {
      const amount = acc.balanceType === 'Cr' ? acc.currentBalance : -acc.currentBalance;
      return sum + amount;
    }, 0);

    const totalExpenses = expenseAccounts.reduce((sum, acc) => {
      const amount = acc.balanceType === 'Dr' ? acc.currentBalance : -acc.currentBalance;
      return sum + amount;
    }, 0);

    const netProfitLoss = totalIncome - totalExpenses;
    const isProfit = netProfitLoss >= 0;

    // Group assets by type
    const assetsByType: any = {};
    assetAccounts.forEach(acc => {
      if (!assetsByType[acc.accountType]) {
        assetsByType[acc.accountType] = [];
      }
      assetsByType[acc.accountType].push({
        _id: acc._id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        balance: acc.currentBalance,
        balanceType: acc.balanceType,
      });
    });

    // Group liabilities by type
    const liabilitiesByType: any = {};
    liabilityAccounts.forEach(acc => {
      if (!liabilitiesByType[acc.accountType]) {
        liabilitiesByType[acc.accountType] = [];
      }
      liabilitiesByType[acc.accountType].push({
        _id: acc._id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        balance: acc.currentBalance,
        balanceType: acc.balanceType,
      });
    });

    // Capital accounts
    const capitalList = capitalAccounts.map(acc => ({
      _id: acc._id,
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      accountType: acc.accountType,
      balance: acc.currentBalance,
      balanceType: acc.balanceType,
    }));

    // Calculate totals
    const totalAssets = assetAccounts.reduce((sum, acc) => {
      const amount = acc.balanceType === 'Dr' ? acc.currentBalance : -acc.currentBalance;
      return sum + amount;
    }, 0);

    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => {
      const amount = acc.balanceType === 'Cr' ? acc.currentBalance : -acc.currentBalance;
      return sum + amount;
    }, 0);

    const totalCapital = capitalAccounts.reduce((sum, acc) => {
      const amount = acc.balanceType === 'Cr' ? acc.currentBalance : -acc.currentBalance;
      return sum + amount;
    }, 0);

    // Calculate type-wise totals for assets
    const assetTypeTotals: any = {};
    Object.keys(assetsByType).forEach(type => {
      assetTypeTotals[type] = assetsByType[type].reduce((sum: number, acc: any) => {
        const amount = acc.balanceType === 'Dr' ? acc.balance : -acc.balance;
        return sum + amount;
      }, 0);
    });

    // Calculate type-wise totals for liabilities
    const liabilityTypeTotals: any = {};
    Object.keys(liabilitiesByType).forEach(type => {
      liabilityTypeTotals[type] = liabilitiesByType[type].reduce((sum: number, acc: any) => {
        const amount = acc.balanceType === 'Cr' ? acc.balance : -acc.balance;
        return sum + amount;
      }, 0);
    });

    // Total Liabilities + Capital (including profit/loss)
    const totalLiabilitiesAndCapital = totalLiabilities + totalCapital + netProfitLoss;
    
    // Check if balance sheet is balanced
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndCapital) < 0.01;
    const difference = totalAssets - totalLiabilitiesAndCapital;

    return NextResponse.json({
      success: true,
      assets: assetsByType,
      liabilities: liabilitiesByType,
      capital: capitalList,
      assetTypeTotals,
      liabilityTypeTotals,
      profitLoss: {
        amount: Math.abs(netProfitLoss),
        isProfit,
      },
      summary: {
        totalAssets,
        totalLiabilities,
        totalCapital,
        netProfitLoss: Math.abs(netProfitLoss),
        isProfit,
        totalLiabilitiesAndCapital,
        isBalanced,
        difference: Math.abs(difference),
      },
      financialYear,
      asOnDate,
    });
  } catch (error: any) {
    console.error('Error fetching balance sheet:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch balance sheet' },
      { status: 500 }
    );
  }
}






















