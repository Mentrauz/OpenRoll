import BooksStats from '@/models/BooksStats';
import Account from '@/models/Account';
import Voucher from '@/models/Voucher';

/**
 * Update books statistics in the database
 * This should be called after creating/updating/deleting accounts or vouchers
 */
export async function updateBooksStats(unitId?: string) {
  try {
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
          $gte: new Date(new Date().getFullYear(), 3, 1), // Current financial year (April 1st)
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

    await BooksStats.findOneAndUpdate(
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

    return {
      success: true,
      stats: {
        totalAccounts,
        activeVouchers,
        totalTransactions,
        accuracyRate,
      },
    };
  } catch (error: any) {
    console.error('Error updating books stats:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update stats asynchronously without blocking the main operation
 */
export function updateBooksStatsAsync(unitId?: string) {
  // Update stats in background without awaiting
  updateBooksStats(unitId).catch((error) => {
    console.error('Background stats update failed:', error);
  });
}






















