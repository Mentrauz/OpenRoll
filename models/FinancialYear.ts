import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialYear extends Document {
  yearCode: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isClosed: boolean;
  closingDate?: Date;
  unitId?: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialYearSchema: Schema = new Schema(
  {
    yearCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Format: FY2023-24
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    closingDate: {
      type: Date,
      default: null,
    },
    unitId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
// Note: yearCode already has a unique index from unique: true
FinancialYearSchema.index({ isActive: 1 });
FinancialYearSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.FinancialYear || mongoose.model<IFinancialYear>('FinancialYear', FinancialYearSchema);






















