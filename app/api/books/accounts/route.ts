import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/models/Account';
import { updateBooksStatsAsync } from '@/lib/accounting/updateStats';

// GET - List all accounts or search
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const group = searchParams.get('group');
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const unitId = searchParams.get('unitId');

    let query: any = {};

    if (search) {
      query.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { accountCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (group) {
      query.accountGroup = group;
    }

    if (type) {
      query.accountType = type;
    }

    if (active !== null && active !== undefined) {
      query.isActive = active === 'true';
    }

    if (unitId) {
      query.unitId = unitId;
    }

    const accounts = await Account.find(query).sort({ accountCode: 1 });

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      accountCode,
      accountName,
      accountGroup,
      accountType,
      parentGroup,
      openingBalance,
      openingBalanceType,
      unitId,
      description,
    } = body;

    // Validate required fields
    if (!accountCode || !accountName || !accountGroup || !accountType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if account code already exists
    const existingAccount = await Account.findOne({ accountCode });
    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: 'Account code already exists' },
        { status: 400 }
      );
    }

    // Create new account
    const account = new Account({
      accountCode,
      accountName,
      accountGroup,
      accountType,
      parentGroup,
      openingBalance: openingBalance || 0,
      openingBalanceType: openingBalanceType || 'Dr',
      currentBalance: openingBalance || 0,
      balanceType: openingBalanceType || 'Dr',
      unitId,
      description,
      isActive: true,
    });

    await account.save();

    // Update statistics in background
    updateBooksStatsAsync(unitId);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      account,
    });
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}

// PUT - Update account
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Don't allow updating account code if it's already in use by another account
    if (updateData.accountCode) {
      const existingAccount = await Account.findOne({
        accountCode: updateData.accountCode,
        _id: { $ne: _id },
      });
      if (existingAccount) {
        return NextResponse.json(
          { success: false, message: 'Account code already exists' },
          { status: 400 }
        );
      }
    }

    const account = await Account.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    // Update statistics in background
    updateBooksStatsAsync(account.unitId);

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      account,
    });
  } catch (error: any) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE - Delete account
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }

    // TODO: Check if account has transactions before deleting
    // For now, we'll just mark it as inactive instead of deleting
    const account = await Account.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    // Update statistics in background
    updateBooksStatsAsync(account.unitId);

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
      account,
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}






















