import mongoose, { Schema, Document } from 'mongoose';

export interface IBooksStats extends Document {
  totalAccounts: number;
  activeVouchers: number;
  totalTransactions: number;
  accuracyRate: number;
  lastCalculated: Date;
  unitId?: string; // Optional: if you want stats per unit
  createdAt: Date;
  updatedAt: Date;
}

const BooksStatsSchema: Schema = new Schema(
  {
    totalAccounts: {
      type: Number,
      default: 0,
    },
    activeVouchers: {
      type: Number,
      default: 0,
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    accuracyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
    unitId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
BooksStatsSchema.index({ unitId: 1 });
BooksStatsSchema.index({ lastCalculated: -1 });

export default mongoose.models.BooksStats || mongoose.model<IBooksStats>('BooksStats', BooksStatsSchema);






















