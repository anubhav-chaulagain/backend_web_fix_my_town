import z from "zod";

export const IssueSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must not exceed 100 characters"),
    category: z.enum(['Pothole', 'Broken Streetlight', 'Garbage', 'Water Leakage', 'Other']),
    location: z.string().min(5, "Location must be at least 5 characters").max(200, "Location must not exceed 200 characters"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must not exceed 1000 characters"),
    issueImages: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
    status: z.enum(['pending', 'in-progress', 'resolved', 'rejected']).default('pending'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    reportedBy: z.string(), // ObjectId as string
    assignedTo: z.string().optional(), // ObjectId as string
    resolvedAt: z.date().optional(),
    remarks: z.string().max(500).optional(),
});

export type IssueType = z.infer<typeof IssueSchema>;