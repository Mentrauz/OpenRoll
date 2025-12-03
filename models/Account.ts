import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  accountCode: string;
  accountName: string;
  accountGroup: 'Assets' | 'Liabilities' | 'Income' | 'Expenses' | 'Capital';
  accountType: string;
  parentGroup?: string;
  openingBalance: number;
  openingBalanceType: 'Dr' | 'Cr';
  currentBalance: number;
  balanceType: 'Dr' | 'Cr';
  isActive: boolean;
  unitId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema = new Schema(
  {
    accountCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountGroup: {
      type: String,
      required: true,
      enum: ['Assets', 'Liabilities', 'Income', 'Expenses', 'Capital'],
    },
    accountType: {
      type: String,
      required: true,
      enum: [
        'Bank Account',
        'Cash',
        'Sundry Debtors',
        'Sundry Creditors',
        'Fixed Assets',
        'Current Assets',
        'Current Liabilities',
        'Direct Income',
        'Indirect Income',
        'Direct Expenses',
        'Indirect Expenses',
        'Capital Account',
        'Loans',
        'Duties & Taxes',
        'Provisions',
        'Other'
      ],
    },
    parentGroup: {
      type: String,
      default: null,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    openingBalanceType: {
      type: String,
      enum: ['Dr', 'Cr'],
      default: 'Dr',
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    balanceType: {
      type: String,
      enum: ['Dr', 'Cr'],
      default: 'Dr',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unitId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries (accountCode already has unique index from unique: true)
AccountSchema.index({ accountName: 1 });
AccountSchema.index({ accountGroup: 1 });
AccountSchema.index({ isActive: 1 });

export default mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);






















