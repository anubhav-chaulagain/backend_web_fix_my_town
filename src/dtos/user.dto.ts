
import z from "zod";
import { UserSchema } from "../types/user.type";
// re-use UserSchema from types

export const CreateUserDTO = UserSchema.pick(
  {
    fullname:true,
    email: true,
    password: true,
    role: true,
  }
);

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const AdminCreateUserDTO = UserSchema.pick(
  {
    fullname:true,
    email: true,
    password: true,
    role: true,
    profilePicture: true,
  }
);

export type AdminCreateUserDTO = z.infer<typeof AdminCreateUserDTO>;

export const LoginUserDTO = UserSchema.pick(
    {
        email: true,
        password: true
    }
);

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

export const UpdateUserDTO = UserSchema.partial(); // all fields optional for update
export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;

export const ReportStatsDTO = UserSchema.pick(
  {
    totalReports: true,
    pendingReports: true,
    resolvedReports: true,
    inprogressReports: true,
  }
);
export type ReportStatsDTO = z.infer<typeof ReportStatsDTO>;

export const CreateAuthorityDTO = z.object({
    fullname: z.string().min(3).max(30),
    email: z.email().min(5),
    password: z.string().min(3).max(30),
    role: z.literal('authority'),
    department: z.string().min(2, "Department is required"),
    employeeId: z.string().min(3, "Employee ID is required").optional(), // Make optional
    phoneNumber: z.string().min(10, "Phone number is required"),
    profilePicture: z.string().optional(),
});

export type CreateAuthorityDTO = z.infer<typeof CreateAuthorityDTO>;

export const AuthorityStatsDTO = UserSchema.pick({
    assignedIssuesCount: true,
    completedIssuesCount: true,
    department: true,
    phoneNumber: true,
    employeeId: true,
});

export type AuthorityStatsDTO = z.infer<typeof AuthorityStatsDTO>;

export const UpdateProfileDTO = z.object({
    fullname: z.string().min(1).optional(),
    removeProfilePicture: z.string().optional(), // comes as string from FormData
});
export type UpdateProfileDTO = z.infer<typeof UpdateProfileDTO>;