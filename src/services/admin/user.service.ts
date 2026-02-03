import jwt from "jsonwebtoken";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../../dtos/user.dto";
import { HttpError } from "../../errors/http-error";
import { UserRepository } from "../../repositories/user.repository";
import { JWT_SECRET } from "../../config";
import bcrypt from "bcryptjs";

let userRepository = new UserRepository();

export class AdminUserService {
    async createUser(data: CreateUserDTO){
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

    async getAllUsers(){
        const users = await userRepository.getAllUsers();
        return users;
    }

    async deleteUser(id: string){
        const user = await userRepository.getUserByEmail(id);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        const deleted = await userRepository.deleteUser(id);
        return deleted;
    }

    async updateUser(id: string, updateData: UpdateUserDTO){
        const user = await userRepository.getUserByEmail(id);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        const updatedUser = await userRepository.updateUser(id, updateData);
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