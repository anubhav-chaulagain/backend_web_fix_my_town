import z from "zod";
import { CrewSchema } from "../types/crew.type";

export const CreateCrewDTO = CrewSchema.pick({
    name: true,
    members: true,
    department: true,
    status: true,
});

export type CreateCrewDTO = z.infer<typeof CreateCrewDTO>;

export const UpdateCrewDTO = CrewSchema.pick({
    name: true,
    members: true,
    status: true,
    department: true,
}).partial();

export type UpdateCrewDTO = z.infer<typeof UpdateCrewDTO>;

export const UpdateCrewStatusDTO = CrewSchema.pick({
    status: true,
    currentIssueId: true,
});

export type UpdateCrewStatusDTO = z.infer<typeof UpdateCrewStatusDTO>;

export const AssignCrewToIssueDTO = z.object({
    issueId: z.string().min(1, "Issue ID is required"),
});

export type AssignCrewToIssueDTO = z.infer<typeof AssignCrewToIssueDTO>;