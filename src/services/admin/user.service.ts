import jwt from "jsonwebtoken";
import { AdminCreateUserDTO, CreateAuthorityDTO, CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../../dtos/user.dto";
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

    async createAuthority(data: CreateAuthorityDTO) {
        // Check if email already exists
        const emailCheck = await userRepository.getUserByEmail(data.email);
        if (emailCheck) {
            throw new HttpError(400, "Email already in use");
        }

        // Auto-generate employeeId if not provided
        let employeeId = data.employeeId;
        if (!employeeId) {
            employeeId = await this.generateEmployeeId();
        } else {
            // Check if manually entered employeeId already exists
            const employeeIdCheck = await userRepository.getUserByEmployeeId(employeeId);
            if (employeeIdCheck) {
                throw new HttpError(400, "Employee ID already in use");
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create authority user with default values
        const authorityData = {
            ...data,
            employeeId,
            password: hashedPassword,
            role: 'authority' as const,
            assignedIssuesCount: 0,
            completedIssuesCount: 0,
            isActive: true,
        };

        const newAuthority = await userRepository.createUser(authorityData);
        return newAuthority;
    }

    // Helper method to generate unique employee ID
    private async generateEmployeeId(): Promise<string> {
        const year = new Date().getFullYear();
        let counter = 1;
        let employeeId = `EMP-${year}-${String(counter).padStart(3, '0')}`;

        // Keep incrementing until we find an unused ID
        while (await userRepository.getUserByEmployeeId(employeeId)) {
            counter++;
            employeeId = `EMP-${year}-${String(counter).padStart(3, '0')}`;
        }

        return employeeId;
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
        const user = await userRepository.getUserbyId(id);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        const deleted = await userRepository.deleteUser(id);
        return deleted;
    }

    async updateUser(id: string, updateData: UpdateUserDTO){
        const user = await userRepository.getUserbyId(id);
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

    async  getUserById(id: string){
        const user = await userRepository.getUserbyId(id);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        return user;
    }

}