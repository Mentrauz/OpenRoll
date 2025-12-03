import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Voucher from '@/models/Voucher';
import Account from '@/models/Account';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get cash book (all cash transactions)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();

    // Get all cash accounts
    const cashAccounts = await Account.find({ 
      accountType: 'Cash', 
      isActive: true 
    });
    const cashAccountIds = cashAccounts.map(acc => acc._id.toString());

    if (cashAccountIds.length === 0) {
      return NextResponse.json({
        success: true,
        cashBookEntries: [],
        summary: {
          totalVouchers: 0,
          totalReceipts: 0,
          totalPayments: 0,
          openingBalance: 0,
          closingBalance: 0,
        },
      });
    }

    // Build query for vouchers involving cash accounts
    let query: any = {
      financialYear,
      'entries.accountId': { $in: cashAccountIds },
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

    // Get all cash vouchers
    const vouchers = await Voucher.find(query).sort({ voucherDate: 1, voucherNumber: 1 });

    // Format for cash book display
    const cashBookEntries = vouchers.map(voucher => {
      // Find cash entry in this voucher
      const cashEntry = voucher.entries.find(entry => 
        cashAccountIds.includes(entry.accountId.toString())
      );

      // Find other entry (contra entry)
      const contraEntry = voucher.entries.find(entry => 
        !cashAccountIds.includes(entry.accountId.toString())
      );

      return {
        _id: voucher._id,
        date: voucher.voucherDate,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.voucherType,
        particulars: contraEntry?.accountName || 'Unknown',
        referenceNumber: voucher.referenceNumber,
        chequeNumber: voucher.chequeNumber,
        narration: voucher.narration,
        receipt: cashEntry?.credit || 0,
        payment: cashEntry?.debit || 0,
      };
    });

    // Calculate opening balance (sum of all cash account opening balances)
    const openingBalance = cashAccounts.reduce((sum, acc) => {
      const balance = acc.balanceType === 'Dr' ? acc.openingBalance : -acc.openingBalance;
      return sum + balance;
    }, 0);

    // Calculate totals
    const totalReceipts = cashBookEntries.reduce((sum, entry) => sum + entry.receipt, 0);
    const totalPayments = cashBookEntries.reduce((sum, entry) => sum + entry.payment, 0);
    const closingBalance = openingBalance + totalReceipts - totalPayments;

    return NextResponse.json({
      success: true,
      cashBookEntries,
      cashAccounts: cashAccounts.map(acc => ({
        _id: acc._id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        currentBalance: acc.currentBalance,
        balanceType: acc.balanceType,
      })),
      summary: {
        totalVouchers: vouchers.length,
        totalReceipts,
        totalPayments,
        openingBalance,
        closingBalance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cash book:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch cash book' },
      { status: 500 }
    );
  }
}






















