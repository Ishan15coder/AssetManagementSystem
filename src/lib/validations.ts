import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const assetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  serialNumber: z.string().min(3, "Serial number must be at least 3 characters"),
  categoryId: z.number().int().positive("Invalid category selection"),
  acquisitionDate: z.string().transform((val) => new Date(val)),
  acquisitionCost: z.number().nonnegative("Cost cannot be negative"),
  condition: z.enum(["New", "Good", "Fair", "Poor"]),
  location: z.string().min(2, "Location details are required"),
  isBookable: z.boolean().default(false),
  photoUrl: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
});

/*
 * We enforce that an allocation is assigned to either an employee or a department 
 * (but not left completely empty or assigned to both simultaneously) to maintain referential integrity.
 */
export const allocationSchema = z.object({
  assetId: z.number().int().positive(),
  employeeId: z.number().int().positive().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  expectedReturnDate: z.string().nullable().optional().transform((val) => (val ? new Date(val) : null)),
}).refine(
  (data) => (data.employeeId ? !data.departmentId : !!data.departmentId),
  { message: "Allocation must be assigned to either an Employee or a Department, but not both or neither." }
);

/*
 * Start date must precede the end date to ensure schedule logic sanity.
 */
export const bookingSchema = z.object({
  assetId: z.number().int().positive(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
}).refine((data) => data.startDate < data.endDate, {
  message: "Start date must be earlier than the end date.",
});

export const maintenanceSchema = z.object({
  assetId: z.number().int().positive(),
  description: z.string().min(5, "Please describe the issue in more detail"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
});

export const auditCycleSchema = z.object({
  name: z.string().min(3, "Audit name is required"),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  auditorId: z.number().int().positive(),
}).refine((data) => data.startDate < data.endDate, {
  message: "Audit cycle start date must be earlier than the end date.",
});
