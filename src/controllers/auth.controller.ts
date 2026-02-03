import { UserService } from "../services/user.service";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { Request, Response } from "express";
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

    // async updateUser(req: Request, res: Response) {
    //     try {
    //         const userId = req.user?._id;
    //         if (!userId) {
    //             return res.status(400).json(
    //                 { success: false, message: "User ID not provided" }
    //             );
    //         }
    //         let parsedData = UpdateUserDTO.safeParse(req.body);
    //         if (!parsedData.success) {
    //             return res.status(400).json(
    //                 { success: false, message: z.prettifyError(parsedData.error) }
    //             )
    //         }
    //         if (req.file) { // if file is being uploaded
    //             parsedData.data.imageUrl = `/uploads/${req.file.filename}`;
    //         }
    //         const updatedUser = await userService.updateUser(userId, parsedData.data);
    //         return res.status(200).json(
    //             { success: true, message: "User updated successfully", data: updatedUser }
    //         );
    //     } catch (error: Error | any) {
    //         return res.status(error.statusCode ?? 500).json(
    //             { success: false, message: error.message || "Internal Server Error" }
    //         );
    //     }
    // }
}