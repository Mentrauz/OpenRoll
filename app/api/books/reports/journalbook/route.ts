import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Voucher from '@/models/Voucher';
import { getCurrentFinancialYear } from '@/lib/accounting/utils';

// GET - Get journal book (all journal entries)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();

    // Build query for journal vouchers
    let query: any = {
      financialYear,
      voucherType: 'Journal',
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

    // Get all journal vouchers
    const vouchers = await Voucher.find(query).sort({ voucherDate: 1, voucherNumber: 1 });

    // Format for journal book display
    const journalBookEntries = vouchers.map(voucher => ({
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
    }));

    // Calculate grand totals
    const grandTotalDebit = vouchers.reduce((sum, v) => sum + v.totalDebit, 0);
    const grandTotalCredit = vouchers.reduce((sum, v) => sum + v.totalCredit, 0);

    return NextResponse.json({
      success: true,
      journalBookEntries,
      summary: {
        totalJournals: vouchers.length,
        totalDebit: grandTotalDebit,
        totalCredit: grandTotalCredit,
      },
    });
  } catch (error: any) {
    console.error('Error fetching journal book:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch journal book' },
      { status: 500 }
    );
  }
}






















