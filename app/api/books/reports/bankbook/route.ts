import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Voucher from '@/models/Voucher';
import Account from '@/models/Account';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get bank book (all bank transactions)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();
    const accountId = searchParams.get('accountId'); // Optional: filter by specific bank account

    // Get all bank accounts
    const bankAccountsQuery: any = { 
      accountType: 'Bank Account', 
      isActive: true 
    };
    
    if (accountId) {
      bankAccountsQuery._id = accountId;
    }

    const bankAccounts = await Account.find(bankAccountsQuery);
    const bankAccountIds = bankAccounts.map(acc => acc._id.toString());

    if (bankAccountIds.length === 0) {
      return NextResponse.json({
        success: true,
        bankBookEntries: [],
        bankAccounts: [],
        summary: {
          totalVouchers: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          openingBalance: 0,
          closingBalance: 0,
        },
      });
    }

    // Build query for vouchers involving bank accounts
    let query: any = {
      financialYear,
      'entries.accountId': { $in: bankAccountIds },
    };

    if (startDate && endDate) {
      query.voucherDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.voucherDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.voucherDate = { $lte: new Date(endDate) };
    }

    // Get all bank vouchers
    const vouchers = await Voucher.find(query).sort({ voucherDate: 1, voucherNumber: 1 });

    // Format for bank book display
    const bankBookEntries = vouchers.map(voucher => {
      // Find bank entry in this voucher
      const bankEntry = voucher.entries.find(entry => 
        bankAccountIds.includes(entry.accountId.toString())
      );

      // Find other entry (contra entry)
      const contraEntry = voucher.entries.find(entry => 
        !bankAccountIds.includes(entry.accountId.toString())
      );

      return {
        _id: voucher._id,
        date: voucher.voucherDate,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.voucherType,
        bankAccount: bankEntry?.accountName || 'Unknown',
        particulars: contraEntry?.accountName || 'Unknown',
        referenceNumber: voucher.referenceNumber,
        chequeNumber: voucher.chequeNumber,
        chequeDate: voucher.chequeDate,
        narration: voucher.narration,
        deposit: bankEntry?.debit || 0, // Bank account debited = deposit
        withdrawal: bankEntry?.credit || 0, // Bank account credited = withdrawal
        isReconciled: voucher.isReconciled,
      };
    });

    // Calculate opening balance
    const openingBalance = bankAccounts.reduce((sum, acc) => {
      const balance = acc.balanceType === 'Dr' ? acc.openingBalance : -acc.openingBalance;
      return sum + balance;
    }, 0);

    // Calculate totals
    const totalDeposits = bankBookEntries.reduce((sum, entry) => sum + entry.deposit, 0);
    const totalWithdrawals = bankBookEntries.reduce((sum, entry) => sum + entry.withdrawal, 0);
    const closingBalance = openingBalance + totalDeposits - totalWithdrawals;

    return NextResponse.json({
      success: true,
      bankBookEntries,
      bankAccounts: bankAccounts.map(acc => ({
        _id: acc._id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        currentBalance: acc.currentBalance,
        balanceType: acc.balanceType,
      })),
      summary: {
        totalVouchers: vouchers.length,
        totalDeposits,
        totalWithdrawals,
        openingBalance,
        closingBalance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching bank book:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch bank book' },
      { status: 500 }
    );
  }
}






















