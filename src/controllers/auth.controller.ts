import { UserService } from "../services/user.service";
import { CreateAuthorityDTO, CreateUserDTO, LoginUserDTO, UpdateProfileDTO, UpdateUserDTO } from "../dtos/user.dto";
import { NextFunction, Request, Response } from "express";
import z from "zod"
import { IUser } from "../models/user.model";

let userService = new UserService();

export class AuthController {
    async register(req: Request, res: Response) {
        console.log("backend register")
        try {
            const parsedData = CreateUserDTO.safeParse(req.body); // validate request body
            if(!parsedData.success){
                return res.status(400).json(
                    {success: false, message: z.prettifyError(parsedData.error)}
                )
            }
            const userData: CreateUserDTO = parsedData.data;
            const newUser = await userService.createUser(userData);
            return res.status(201).json(
                {success: true, message: "User Created", data: newUser}
            );
        } catch (error: Error | any) { // exception handling
            return res.status(error.statusCode ?? 500).json(
                {success: false, message: error.message || "Internal Server Error"}
            );
        }
    }

    async login(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    {success: false, message: z.prettifyError(parsedData.error)}
                )
            }
            const loginData: LoginUserDTO = parsedData.data;
            const { token, user } = await userService.loginUser(loginData);
            return res.status(200).json(
                { success: true, message: "Login successful", data: user, token }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error"}
            )
        }
    }

    async getUserByEmail(req: Request, res: Response) {
        try {
            const userId = (req.user as IUser)?.email;
            if (!userId) {
                return res.status(400).json(
                    { success: false, message: "User ID not provided" }
                );
            }
            const user = await userService.getUserbyEmail(userId);
            return res.status(200).json(
                { success: true, message: "User fetched successfully", data: user }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async requestPasswordReset(req: Request, res: Response) {
        try {
            const email = req.body.email;
            if (!email) {
                return res.status(400).json(
                    { success: false, message: "Email is required" }
                );
            }
            const user = await userService.sendResetPasswordEmail(email);
            return res.status(200).json(
                {
                    success: true,
                    data: user,
                    message: "Password reset email sent"
                }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const token = req.params.token;
            const { newPassword } = req.body;
            await userService.resetPassword(token, newPassword);
            return res.status(200).json(
                { success: true, message: "Password has been reset successfully." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getUserReportStats(req: Request, res: Response) {
        try {
            const userId = (req.user as IUser)?._id.toString();
            if (!userId) {
                return res.status(400).json(
                    { success: false, message: "User ID not provided" }
                );
            }
            const stats = await userService.getUserReportStats(userId);
            return res.status(200).json(
                { success: true, message: "User report stats fetched successfully", data: stats }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getAuthorityStats(req: Request, res: Response) {
        try {
            const userId = (req.user as IUser)?._id.toString();
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            
            const stats = await userService.getAuthorityStats(userId); // Use service instead
            return res.status(200).json({ success: true, data: stats });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({ 
                success: false, 
                message: error.message || "Internal Server Error" 
            });
        }
    }

    async registerAuthority(req: Request, res: Response) {
        console.log("backend register authority");
        try {
            const parsedData = CreateAuthorityDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }
            
            const authorityData: CreateAuthorityDTO = parsedData.data;
            const newAuthority = await userService.createAuthority(authorityData);
            
            return res.status(201).json({
                success: true,
                message: "Authority user created successfully",
                data: newAuthority
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user._id; // from your auth middleware

            const parsedData = UpdateProfileDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const updateData: any = { ...parsedData.data };

            // New image uploaded
            if (req.file) {
                updateData.profilePicture = req.file.filename;
            }

            // Remove existing image
            if (parsedData.data.removeProfilePicture === 'true') {
                updateData.profilePicture = null;
            }

            // Don't store this flag in DB
            delete updateData.removeProfilePicture;

            const updatedUser = await userService.updateProfile(userId, updateData);
            return res.status(200).json(
                { success: true, message: "Profile updated", data: updatedUser }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

}