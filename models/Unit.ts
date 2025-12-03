import mongoose from 'mongoose';

const UnitSchema = new mongoose.Schema({
  // ... other fields ...
  
  lwfLimit: {
    type: Number,
    required: true,
    default: 0
  },
  lwfRate: {
    type: Number,
    required: true,
    default: 0
  },
  monthDays: {
    type: Number,
    required: true,
    default: 31
  },
  monthDaysType: {
    type: String,
    enum: ['month', 'specific'],
    default: 'month'
  },
  
  // ... other fields ...
}, {
  timestamps: true
});

const Unit = mongoose.models.Unit || mongoose.model('Unit', UnitSchema);

export default Unit; 





















