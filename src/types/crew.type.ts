import z from "zod";

export const CrewSchema = z.object({
    name: z.string().min(3, "Crew name must be at least 3 characters"),
    authorityId: z.string(),
    members: z.array(z.string()).min(1, "At least one member is required"),
    currentIssueId: z.string().optional(),
    status: z.enum(['available', 'on-task', 'off-duty']).default('available'),
    department: z.string().min(2, "Department is required"),
});

export type CrewType = z.infer<typeof CrewSchema>;