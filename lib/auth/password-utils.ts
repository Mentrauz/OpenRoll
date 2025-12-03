import bcrypt from 'bcrypt';

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // Optimized for performance while maintaining security
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a plain text password against a hashed password using bcrypt
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
}

/**
 * Validate credentials format and requirements
 */
export async function validateCredentials(tmsId: string, password: string): Promise<void> {
  if (!tmsId || !password) {
    throw new Error('Missing credentials');
  }
  // No strength requirements; only presence is checked here
}

/**
 * Generate a random password for initial setup
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
} 





















