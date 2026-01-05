import z from "zod";

export const UserSchema = z.object({
    fullname: z.string().min(3).max(30),
    email: z.email().min(5),
    password: z.string().min(3).max(30),
    number: z.string().min(10, "10 characters only!").max(10, "10 characters only!"),
    role: z.enum(['citizen', 'authority']).default('citizen'),
});

export type UserType = z.infer<typeof UserSchema>;