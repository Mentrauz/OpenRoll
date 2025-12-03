import mongoose from 'mongoose';

export type ChangeType = 
  | 'employee_registration' 
  | 'employee_update' 
  | 'unit_registration' 
  | 'unit_update' 
  | 'attendance_mark'
  | 'bulk_upload';

export type ChangeStatus = 'pending' | 'approved' | 'rejected';

export interface IPendingChange {
  changeType: ChangeType;
  status: ChangeStatus;
  requestedBy: string; // ID of person who made the change
  requestedByRole: string; // Role of person who made the change
  requestedAt: Date;
  
  // For admin actions
  reviewedBy?: string; // ID of admin who approved/rejected
  reviewedAt?: Date;
  reviewComments?: string;
  
  // The actual data being changed
  changeData: any; // Will contain the actual data (employee, unit, etc.)
  
  // Metadata for context
  targetCollection?: string; // For employee changes - which unit collection
  targetDatabase?: string; // Which database (Employees, Units, etc.)
  targetDocumentId?: string; // For updates - the ID of document being updated
  
  // For display purposes
  description: string; // Human-readable description of change
  
  createdAt?: Date;
  updatedAt?: Date;
}

const PendingChangeSchema = new mongoose.Schema<IPendingChange>({
  changeType: {
    type: String,
    required: true,
    enum: ['employee_registration', 'employee_update', 'unit_registration', 'unit_update', 'attendance_mark', 'bulk_upload']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedBy: {
    type: String,
    required: true
  },
  requestedByRole: {
    type: String,
    required: true
  },
  requestedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  reviewedBy: {
    type: String
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String
  },
  changeData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  targetCollection: {
    type: String
  },
  targetDatabase: {
    type: String
  },
  targetDocumentId: {
    type: String
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
PendingChangeSchema.index({ status: 1, requestedAt: -1 });
PendingChangeSchema.index({ requestedBy: 1, requestedAt: -1 });
PendingChangeSchema.index({ changeType: 1, status: 1 });

const PendingChange = (mongoose.models.PendingChange || mongoose.model<IPendingChange>('PendingChange', PendingChangeSchema)) as mongoose.Model<IPendingChange>;

export default PendingChange;






















