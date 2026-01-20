import z from "zod";

export const UserSchema = z.object({
    fullname: z.string().min(3).max(30),
    email: z.email().min(5),
    password: z.string().min(3).max(30),
    role: z.enum(['citizen', 'authority']).default('citizen'),
});

export type UserType = z.infer<typeof UserSchema>;