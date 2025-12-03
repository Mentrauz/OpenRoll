import { z } from 'zod'

export const userSchema = z.object({
  tmsId: z.string().min(1, 'ID is required'),
  name: z.string().trim().min(1, 'Name is required').optional(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['admin', 'accounts', 'data-operations', 'supervisor', 'hr']).default('supervisor'),
  email: z.string().email().optional(),
  department: z.string().optional()
})

export const loginSchema = z.object({
  tmsId: z.string().min(1, 'ID is required'),
  password: z.string().min(1, 'Password is required')
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  salary: z.number().positive('Salary must be positive')
})

export const payrollSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  basicSalary: z.number().positive(),
  deductions: z.number().default(0),
  bonus: z.number().default(0),
  netSalary: z.number().positive()
})

export type UserInput = z.infer<typeof userSchema>
export type EmployeeInput = z.infer<typeof employeeSchema>
export type PayrollInput = z.infer<typeof payrollSchema> 





















