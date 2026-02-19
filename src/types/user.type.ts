import z from "zod";

export const UserSchema = z.object({
    fullname: z.string().min(3).max(30),
    email: z.email().min(5),
    password: z.string().min(3).max(30),
    role: z.enum(['citizen', 'authority']).default('citizen'),
    profilePicture: z.string().optional(),
    
    // Citizen stats
    totalReports: z.number().default(0),
    pendingReports: z.number().default(0),
    resolvedReports: z.number().default(0),
    inprogressReports: z.number().default(0),
    
    // Authority-specific
    department: z.string().optional(),
    employeeId: z.string().optional(),
    assignedIssuesCount: z.number().default(0),
    completedIssuesCount: z.number().default(0),
    phoneNumber: z.string().optional(),
    isActive: z.boolean().default(true),
});

export type UserType = z.infer<typeof UserSchema>;