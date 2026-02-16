import z from "zod";
import { IssueSchema } from "../types/issue.type";
// re-use IssueSchema from types

export const CreateIssueDTO = IssueSchema.pick({
    title: true,
    category: true,
    location: true,
    latitude: true,
    longitude: true,
    description: true,
    issueImages: true,
    reportedBy: true,
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
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
});

export type IssueFilterDTO = z.infer<typeof IssueFilterDTO>;