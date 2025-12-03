import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Voucher from '@/models/Voucher';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get day book (all transactions)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();
    const voucherType = searchParams.get('type');

    // Build query
    let query: any = { financialYear };

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

    if (voucherType) {
      query.voucherType = voucherType;
    }

    // Get all vouchers
    const vouchers = await Voucher.find(query).sort({ voucherDate: 1, voucherNumber: 1 });

    // Format for day book display
    const dayBookEntries = vouchers.map(voucher => ({
      _id: voucher._id,
      date: voucher.voucherDate,
      voucherNumber: voucher.voucherNumber,
      voucherType: voucher.voucherType,
      entries: voucher.entries.map(entry => ({
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        debit: entry.debit,
        credit: entry.credit,
        narration: entry.narration,
      })),
      narration: voucher.narration,
      totalDebit: voucher.totalDebit,
      totalCredit: voucher.totalCredit,
      referenceNumber: voucher.referenceNumber,
      chequeNumber: voucher.chequeNumber,
    }));

    // Calculate grand totals
    const grandTotalDebit = vouchers.reduce((sum, v) => sum + v.totalDebit, 0);
    const grandTotalCredit = vouchers.reduce((sum, v) => sum + v.totalCredit, 0);

    return NextResponse.json({
      success: true,
      dayBookEntries,
      summary: {
        totalVouchers: vouchers.length,
        totalDebit: grandTotalDebit,
        totalCredit: grandTotalCredit,
      },
    });
  } catch (error: any) {
    console.error('Error fetching day book:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch day book' },
      { status: 500 }
    );
  }
}






















