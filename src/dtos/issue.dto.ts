import z from "zod";
import { IssueSchema } from "../types/issue.type";

// Special DTO for creating issues from FormData (accepts string coordinates)
export const CreateIssueDTO = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must not exceed 100 characters"),
    category: z.enum(['Pothole', 'Broken Streetlight', 'Garbage', 'Water Leakage', 'Other']),
    location: z.string().min(5, "Location must be at least 5 characters").max(200, "Location must not exceed 200 characters"),
    latitude: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    longitude: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must not exceed 1000 characters"),
    // issueImages will be handled separately in controller from req.files
});

export type CreateIssueDTO = z.infer<typeof CreateIssueDTO>;

export const UpdateIssueDTO = IssueSchema.partial(); // all fields optional for update
export type UpdateIssueDTO = z.infer<typeof UpdateIssueDTO>;

export const UpdateIssueStatusDTO = IssueSchema.pick({
    status: true,
    remarks: true,
});

export type UpdateIssueStatusDTO = z.infer<typeof UpdateIssueStatusDTO>;

export const AssignIssueDTO = IssueSchema.pick({
    assignedTo: true,
    priority: true,
});

export type AssignIssueDTO = z.infer<typeof AssignIssueDTO>;

export const ResolveIssueDTO = IssueSchema.pick({
    status: true,
    resolvedAt: true,
    remarks: true,
});

export type ResolveIssueDTO = z.infer<typeof ResolveIssueDTO>;

// Query/Filter DTO for GET requests
export const IssueFilterDTO = z.object({
    status: z.enum(['pending', 'in-progress', 'resolved', 'rejected']).optional(),
    category: z.enum(['Pothole', 'Broken Streetlight', 'Garbage', 'Water Leakage', 'Other']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    reportedBy: z.string().optional(),
    assignedTo: z.string().optional(),
    search: z.string().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
});

export type IssueFilterDTO = z.infer<typeof IssueFilterDTO>;