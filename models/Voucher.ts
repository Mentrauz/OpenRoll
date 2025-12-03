import mongoose, { Schema, Document } from 'mongoose';

export interface IVoucherEntry {
  accountId: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface IVoucher extends Document {
  voucherNumber: string;
  voucherType: 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Sales' | 'Purchase' | 'Debit Note' | 'Credit Note';
  voucherDate: Date;
  financialYear: string;
  entries: IVoucherEntry[];
  totalDebit: number;
  totalCredit: number;
  narration: string;
  referenceNumber?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  attachments?: string[];
  createdBy: string;
  modifiedBy?: string;
  isPosted: boolean;
  isReconciled: boolean;
  unitId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherEntrySchema = new Schema({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  accountCode: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  debit: {
    type: Number,
    default: 0,
    min: 0,
  },
  credit: {
    type: Number,
    default: 0,
    min: 0,
  },
  narration: {
    type: String,
    default: '',
  },
}, { _id: false });

const VoucherSchema: Schema = new Schema(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    voucherType: {
      type: String,
      required: true,
      enum: ['Payment', 'Receipt', 'Journal', 'Contra', 'Sales', 'Purchase', 'Debit Note', 'Credit Note'],
    },
    voucherDate: {
      type: Date,
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
    },
    entries: {
      type: [VoucherEntrySchema],
      required: true,
      validate: {
        validator: function(entries: IVoucherEntry[]) {
          return entries.length >= 2;
        },
        message: 'A voucher must have at least 2 entries (double-entry bookkeeping)',
      },
    },
    totalDebit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCredit: {
      type: Number,
      required: true,
      min: 0,
    },
    narration: {
      type: String,
      default: '',
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    chequeNumber: {
      type: String,
      default: '',
    },
    chequeDate: {
      type: Date,
      default: null,
    },
    attachments: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
    },
    modifiedBy: {
      type: String,
      default: null,
    },
    isPosted: {
      type: Boolean,
      default: true,
    },
    isReconciled: {
      type: Boolean,
      default: false,
    },
    unitId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries (voucherNumber already has unique index from unique: true)
VoucherSchema.index({ voucherType: 1 });
VoucherSchema.index({ voucherDate: 1 });
VoucherSchema.index({ financialYear: 1 });
VoucherSchema.index({ 'entries.accountId': 1 });

// Validation to ensure debit equals credit
VoucherSchema.pre('save', function(next) {
  const totalDebit = this.entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = this.entries.reduce((sum, entry) => sum + entry.credit, 0);
  
  // Round to 2 decimal places to avoid floating point errors
  this.totalDebit = Math.round(totalDebit * 100) / 100;
  this.totalCredit = Math.round(totalCredit * 100) / 100;
  
  if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
    next(new Error('Total Debit must equal Total Credit'));
  } else {
    next();
  }
});

export default mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', VoucherSchema);






















