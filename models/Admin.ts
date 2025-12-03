import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
    id: string;
    password?: string;
    fullName: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true, // Creates an index for fast lookup
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: 'supervisor',
        },
    },
    {
        timestamps: true,
        collection: 'Admin' // Explicitly map to the existing 'Admin' collection
    }
);

// Ensure the index is created
// AdminSchema.index({ id: 1 }); // Removed to avoid duplicate index warning with unique: true

// Prevent OverwriteModelError
const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
