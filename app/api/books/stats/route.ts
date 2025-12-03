import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import BooksStats from '@/models/BooksStats';
import Account from '@/models/Account';
import Voucher from '@/models/Voucher';

// GET - Fetch books statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    // Build query
    const query: any = {};
    if (unitId) {
      query.unitId = unitId;
    }

    // Try to get cached stats (updated recently)
    const cacheThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    let stats = await BooksStats.findOne({
      ...query,
      lastCalculated: { $gte: cacheThreshold },
    }).sort({ lastCalculated: -1 });

    // If no recent stats, calculate fresh
    if (!stats) {
      const accountQuery: any = { isActive: true };
      const voucherQuery: any = { isPosted: true };

      if (unitId) {
        accountQuery.unitId = unitId;
        voucherQuery.unitId = unitId;
      }

      // Calculate stats from database
      const [totalAccounts, activeVouchers, allVouchers] = await Promise.all([
        Account.countDocuments(accountQuery),
        Voucher.countDocuments({
          ...voucherQuery,
          voucherDate: {
            $gte: new Date(new Date().getFullYear(), 3, 1), // Current financial year
          },
        }),
        Voucher.find(voucherQuery).select('totalDebit totalCredit'),
      ]);

      // Calculate total transactions (sum of all voucher entries)
      let totalTransactions = 0;
      allVouchers.forEach((voucher) => {
        // Count entries in each voucher
        totalTransactions += Math.max(
          (voucher.totalDebit > 0 ? 1 : 0) + (voucher.totalCredit > 0 ? 1 : 0),
          2
        );
      });

      // Calculate accuracy rate (balanced vouchers)
      const balancedVouchers = allVouchers.filter(
        (v) => Math.abs(v.totalDebit - v.totalCredit) < 0.01
      ).length;
      const accuracyRate =
        allVouchers.length > 0
          ? Math.round((balancedVouchers / allVouchers.length) * 100)
          : 0;

      // Create or update stats
      stats = await BooksStats.findOneAndUpdate(
        query,
        {
          totalAccounts,
          activeVouchers,
          totalTransactions,
          accuracyRate,
          lastCalculated: new Date(),
          ...query,
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAccounts: stats.totalAccounts,
        activeVouchers: stats.activeVouchers,
        totalTransactions: stats.totalTransactions,
        accuracyRate: stats.accuracyRate,
        lastCalculated: stats.lastCalculated,
      },
    });
  } catch (error: any) {
    console.error('Error fetching books stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch books statistics',
      },
      { status: 500 }
    );
  }
}

// POST - Force recalculate statistics
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { unitId } = body;

    const accountQuery: any = { isActive: true };
    const voucherQuery: any = { isPosted: true };

    if (unitId) {
      accountQuery.unitId = unitId;
      voucherQuery.unitId = unitId;
    }

    // Calculate stats from database
    const [totalAccounts, activeVouchers, allVouchers] = await Promise.all([
      Account.countDocuments(accountQuery),
      Voucher.countDocuments({
        ...voucherQuery,
        voucherDate: {
          $gte: new Date(new Date().getFullYear(), 3, 1), // Current financial year
        },
      }),
      Voucher.find(voucherQuery).select('totalDebit totalCredit entries'),
    ]);

    // Calculate total transactions (count all voucher entries)
    let totalTransactions = 0;
    allVouchers.forEach((voucher: any) => {
      totalTransactions += voucher.entries?.length || 0;
    });

    // Calculate accuracy rate (balanced vouchers)
    const balancedVouchers = allVouchers.filter(
      (v) => Math.abs(v.totalDebit - v.totalCredit) < 0.01
    ).length;
    const accuracyRate =
      allVouchers.length > 0
        ? Math.round((balancedVouchers / allVouchers.length) * 100)
        : 100;

    // Update or create stats
    const query: any = {};
    if (unitId) {
      query.unitId = unitId;
    }

    const stats = await BooksStats.findOneAndUpdate(
      query,
      {
        totalAccounts,
        activeVouchers,
        totalTransactions,
        accuracyRate,
        lastCalculated: new Date(),
        ...query,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Statistics recalculated successfully',
      data: {
        totalAccounts: stats.totalAccounts,
        activeVouchers: stats.activeVouchers,
        totalTransactions: stats.totalTransactions,
        accuracyRate: stats.accuracyRate,
        lastCalculated: stats.lastCalculated,
      },
    });
  } catch (error: any) {
    console.error('Error recalculating books stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to recalculate books statistics',
      },
      { status: 500 }
    );
  }
}






















