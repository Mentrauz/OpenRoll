import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/models/Account';
import Voucher from '@/models/Voucher';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get ledger for a specific account
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get account details
    const account = await Account.findById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.voucherDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      dateFilter.voucherDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.voucherDate = { $lte: new Date(endDate) };
    }

    // Get all vouchers that include this account
    const vouchers = await Voucher.find({
      'entries.accountId': accountId,
      financialYear,
      ...dateFilter,
    }).sort({ voucherDate: 1, voucherNumber: 1 });

    // Build ledger entries with running balance
    let runningBalance = account.openingBalance;
    let runningBalanceType = account.openingBalanceType;

    const ledgerEntries = [];

    for (const voucher of vouchers) {
      const entry = voucher.entries.find(e => e.accountId.toString() === accountId);
      if (entry) {
        // Calculate running balance
        if (account.accountGroup === 'Assets' || account.accountGroup === 'Expenses') {
          // For assets and expenses: Dr increases, Cr decreases
          if (runningBalanceType === 'Dr') {
            runningBalance = runningBalance + entry.debit - entry.credit;
          } else {
            runningBalance = runningBalance - entry.debit + entry.credit;
          }
        } else {
          // For liabilities, capital, income: Cr increases, Dr decreases
          if (runningBalanceType === 'Cr') {
            runningBalance = runningBalance + entry.credit - entry.debit;
          } else {
            runningBalance = runningBalance - entry.credit + entry.debit;
          }
        }

        // Determine balance type
        if (runningBalance < 0) {
          runningBalance = Math.abs(runningBalance);
          runningBalanceType = runningBalanceType === 'Dr' ? 'Cr' : 'Dr';
        }

        // Get contra entry (the other side of the transaction)
        const contraEntry = voucher.entries.find(e => e.accountId.toString() !== accountId);

        ledgerEntries.push({
          date: voucher.voucherDate,
          voucherNumber: voucher.voucherNumber,
          voucherType: voucher.voucherType,
          particulars: contraEntry ? contraEntry.accountName : 'Multiple Accounts',
          narration: entry.narration || voucher.narration,
          debit: entry.debit,
          credit: entry.credit,
          balance: runningBalance,
          balanceType: runningBalanceType,
          voucherId: voucher._id,
        });
      }
    }

    // Calculate totals
    const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);

    return NextResponse.json({
      success: true,
      account: {
        _id: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountGroup: account.accountGroup,
        accountType: account.accountType,
        openingBalance: account.openingBalance,
        openingBalanceType: account.openingBalanceType,
      },
      ledgerEntries,
      summary: {
        openingBalance: account.openingBalance,
        openingBalanceType: account.openingBalanceType,
        totalDebit,
        totalCredit,
        closingBalance: runningBalance,
        closingBalanceType: runningBalanceType,
      },
    });
  } catch (error: any) {
    console.error('Error fetching ledger:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch ledger' },
      { status: 500 }
    );
  }
}






















