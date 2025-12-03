import mongoose from 'mongoose'
import { hashPassword } from '@/lib/auth/password-utils'
import clientPromise from '@/lib/mongodb'

export interface IUser {
  tmsId: string
  password: string
  name: string
  role: 'admin' | 'accounts' | 'data-operations' | 'supervisor' | 'hr'
  email?: string
  department?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  username: string
  password: string
  role: 'admin' | 'accounts' | 'data-operations' | 'supervisor' | 'hr'
}

const userSchema = new mongoose.Schema<IUser>({
  tmsId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'],
    default: 'supervisor'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  department: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  next();
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export async function createUser(userData: CreateUserInput) {
  const { username, password, role } = userData;
  
  const user = {
    username,
    password, // Store password directly
    role,
    createdAt: new Date()
  };

  const client = await clientPromise;
  const db = client.db('Users');
  
  const result = await db.collection('users').insertOne(user);
  return result;
}

export async function findUserByUsername(username: string) {
  const client = await clientPromise;
  const db = client.db('Users');
  return await db.collection('users').findOne({ username });
}

export async function validateUser(username: string, password: string) {
  const user = await findUserByUsername(username);
  
  if (!user) {
    return null;
  }

  // Direct password comparison
  if (user.password !== password) {
    return null;
  }

  return user;
} 





















