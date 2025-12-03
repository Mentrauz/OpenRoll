import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Voucher from '@/models/Voucher';
import Account from '@/models/Account';
import { getCurrentFinancialYear, generateVoucherNumber, validateDoubleEntry, updateAccountBalance } from '@/lib/accounting/utils';
import { updateBooksStatsAsync } from '@/lib/accounting/updateStats';

// GET - List all vouchers with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const voucherType = searchParams.get('type');
    const financialYear = searchParams.get('fy') || getCurrentFinancialYear();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    let query: any = { financialYear };

    if (voucherType) {
      query.voucherType = voucherType;
    }

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

    if (accountId) {
      query['entries.accountId'] = accountId;
    }

    const skip = (page - 1) * limit;
    
    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .sort({ voucherDate: -1, voucherNumber: -1 })
        .skip(skip)
        .limit(limit),
      Voucher.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      vouchers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch vouchers' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

// POST - Create new voucher
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      voucherType,
      voucherDate,
      entries,
      narration,
      referenceNumber,
      chequeNumber,
      chequeDate,
      createdBy,
      unitId,
    } = body;

    // Validate required fields
    if (!voucherType || !voucherDate || !entries || entries.length < 2 || !createdBy) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Calculate totals
    const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    // Validate double entry
    if (!validateDoubleEntry(totalDebit, totalCredit)) {
      return NextResponse.json(
        { success: false, message: 'Total Debit must equal Total Credit' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Get financial year from date
    const financialYear = getCurrentFinancialYear();

    // Generate voucher number
    const lastVoucher = await Voucher.findOne({ voucherType, financialYear })
      .sort({ voucherNumber: -1 });
    
    let lastNumber = 0;
    if (lastVoucher) {
      const parts = lastVoucher.voucherNumber.split('/');
      lastNumber = parseInt(parts[parts.length - 1]) || 0;
    }

    const voucherNumber = generateVoucherNumber(voucherType, financialYear, lastNumber);

    // Enrich entries with account details
    const enrichedEntries = await Promise.all(
      entries.map(async (entry: any) => {
        const account = await Account.findById(entry.accountId);
        if (!account) {
          throw new Error(`Account not found: ${entry.accountId}`);
        }
        return {
          accountId: entry.accountId,
          accountCode: account.accountCode,
          accountName: account.accountName,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          narration: entry.narration || '',
        };
      })
    );

    // Create voucher
    const voucher = new Voucher({
      voucherNumber,
      voucherType,
      voucherDate: new Date(voucherDate),
      financialYear,
      entries: enrichedEntries,
      totalDebit,
      totalCredit,
      narration: narration || '',
      referenceNumber: referenceNumber || '',
      chequeNumber: chequeNumber || '',
      chequeDate: chequeDate ? new Date(chequeDate) : null,
      createdBy,
      isPosted: true,
      unitId: unitId || null,
    });

    await voucher.save();

    // Update account balances
    for (const entry of enrichedEntries) {
      const account = await Account.findById(entry.accountId);
      if (account) {
        const { balance, balanceType } = updateAccountBalance(
          account.currentBalance,
          account.balanceType,
          entry.debit,
          entry.credit,
          account.accountGroup
        );
        
        account.currentBalance = balance;
        account.balanceType = balanceType;
        await account.save();
      }
    }

    // Update statistics in background
    updateBooksStatsAsync(unitId);

    return NextResponse.json({
      success: true,
      message: 'Voucher created successfully',
      voucher,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create voucher' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

// PUT - Update voucher
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, entries, narration, referenceNumber, chequeNumber, chequeDate, modifiedBy } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, message: 'Voucher ID is required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    const existingVoucher = await Voucher.findById(_id);
    if (!existingVoucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Reverse existing account balances
    for (const entry of existingVoucher.entries) {
      const account = await Account.findById(entry.accountId);
      if (account) {
        const { balance, balanceType } = updateAccountBalance(
          account.currentBalance,
          account.balanceType,
          -entry.debit, // Reverse the debit
          -entry.credit, // Reverse the credit
          account.accountGroup
        );
        
        account.currentBalance = balance;
        account.balanceType = balanceType;
        await account.save();
      }
    }

    // Calculate new totals
    const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    // Validate double entry
    if (!validateDoubleEntry(totalDebit, totalCredit)) {
      return NextResponse.json(
        { success: false, message: 'Total Debit must equal Total Credit' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Enrich entries
    const enrichedEntries = await Promise.all(
      entries.map(async (entry: any) => {
        const account = await Account.findById(entry.accountId);
        if (!account) {
          throw new Error(`Account not found: ${entry.accountId}`);
        }
        return {
          accountId: entry.accountId,
          accountCode: account.accountCode,
          accountName: account.accountName,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          narration: entry.narration || '',
        };
      })
    );

    // Update voucher
    existingVoucher.entries = enrichedEntries;
    existingVoucher.totalDebit = totalDebit;
    existingVoucher.totalCredit = totalCredit;
    existingVoucher.narration = narration || '';
    existingVoucher.referenceNumber = referenceNumber || '';
    existingVoucher.chequeNumber = chequeNumber || '';
    existingVoucher.chequeDate = chequeDate ? new Date(chequeDate) : null;
    existingVoucher.modifiedBy = modifiedBy;

    await existingVoucher.save();

    // Apply new account balances
    for (const entry of enrichedEntries) {
      const account = await Account.findById(entry.accountId);
      if (account) {
        const { balance, balanceType } = updateAccountBalance(
          account.currentBalance,
          account.balanceType,
          entry.debit,
          entry.credit,
          account.accountGroup
        );
        
        account.currentBalance = balance;
        account.balanceType = balanceType;
        await account.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher updated successfully',
      voucher: existingVoucher,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error updating voucher:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update voucher' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

// DELETE - Delete voucher
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Voucher ID is required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Reverse account balances
    for (const entry of voucher.entries) {
      const account = await Account.findById(entry.accountId);
      if (account) {
        const { balance, balanceType } = updateAccountBalance(
          account.currentBalance,
          account.balanceType,
          -entry.debit, // Reverse the debit
          -entry.credit, // Reverse the credit
          account.accountGroup
        );
        
        account.currentBalance = balance;
        account.balanceType = balanceType;
        await account.save();
      }
    }

    await Voucher.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Voucher deleted successfully',
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete voucher' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}






















