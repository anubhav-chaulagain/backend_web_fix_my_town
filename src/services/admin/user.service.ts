import jwt from "jsonwebtoken";
import { AdminCreateUserDTO, CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../../dtos/user.dto";
import { HttpError } from "../../errors/http-error";
import { UserRepository } from "../../repositories/user.repository";
import { JWT_SECRET } from "../../config";
import bcrypt from "bcryptjs";

let userRepository = new UserRepository();

export class AdminUserService {
    async createUser(data: AdminCreateUserDTO){
        const emailCheck = await userRepository.getUserByEmail(data.email);
        if(emailCheck){
            throw new HttpError(403, "Email already in use");
        }
        // hash password
        const hashedPassword = await bcrypt.hash(data.password, 10); // 10 - complexity
        data.password = hashedPassword;

        const newUser = await userRepository.createUser(data);
        return newUser;
    }

    async getAllUsers(
        page?: string, size?: string, search?: string
    ){
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const {users, total} = await userRepository.getAllUsers(
            pageNumber, pageSize, search
        );
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize)
        }
        return {users, pagination};
    }

    async deleteUser(id: string){
        const user = await userRepository.getUserByEmail(id);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        const deleted = await userRepository.deleteUser(id);
        return deleted;
    }

    async updateUser(email: string, updateData: UpdateUserDTO){
        const user = await userRepository.getUserByEmail(email);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        const updatedUser = await userRepository.updateUser(email, updateData);
        return updatedUser;
    }

    async  getUserByEmail(email: string){
        const user = await userRepository.getUserByEmail(email);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        return user;
    }
}