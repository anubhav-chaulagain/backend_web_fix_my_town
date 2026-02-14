import { AdminUserService } from "../../services/admin/user.service";
import { NextFunction, Request, Response } from "express";
import z from "zod";
import { AdminCreateUserDTO, CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../../dtos/user.dto";
import { QueryParams } from "../../types/query.type";


let adminUserService = new AdminUserService();
export class AdminUserController {
        async createUser(req: Request, res: Response, next: NextFunction) {
            console.log("Body:", req.body);
            console.log("File:", req.file);
        try {
            const parsedData = AdminCreateUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }

            const userData: AdminCreateUserDTO = parsedData.data;
            
            // Add profilePicture to userData if file exists
            if (req.file) {   
                userData.profilePicture = `/uploads/${req.file.filename}`;
            }
            
            console.log(userData); // Should now show profilePicture
            
            const newUser = await adminUserService.createUser(userData);
            return res.status(201).json(
                { success: true, message: "User Created", data: newUser }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
    
    async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, size, search }: QueryParams = req.query;
            const { users, pagination } = await adminUserService.getAllUsers(
                page, size, search
            );
            return res.status(200).json(
                { success: true, data: users, pagination: pagination, message: "All Users Retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const parsedData = UpdateUserDTO.safeParse(req.body); // validate request body
            if (!parsedData.success) { // validation failed
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            
            if(req.file){   
                parsedData.data.profilePicture = `/uploads/${req.file.filename}`;
            }
            const updateData: UpdateUserDTO = parsedData.data;
            const updatedUser = await adminUserService.updateUser(userId, updateData);
            return res.status(200).json(
                { success: true, message: "User Updated", data: updatedUser }
            );
        }
        catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            
            const deleted = await adminUserService.deleteUser(userId);
            if (!deleted) {
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }
            console.log("User deleted");
            return res.status(200).json(
                { success: true, message: "User Deleted" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getUserByEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const email = req.params.email;
            const user = await adminUserService.getUserByEmail(email);
            return res.status(200).json(
                { success: true, data: user, message: "Single User Retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id as string;
            const user = await adminUserService.getUserById(userId);
            return res.status(200).json(
                { success: true, data: user, message: "Single User Retrieved" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}

