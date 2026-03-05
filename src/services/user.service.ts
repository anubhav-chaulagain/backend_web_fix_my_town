import { CreateAuthorityDTO, CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { CLIENT_URL, JWT_SECRET } from "../config";
import { Types } from "mongoose";
import { sendEmail } from "../config/email";
import { IUser } from "../models/user.model";
import path from "path";
import fs from "fs";

let userRepository = new UserRepository();

export class UserService {
  async createUser(data: CreateUserDTO) {
    // business logic before creating user
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if(emailCheck) {
      throw new Error("Email already in use");
    }

    // const numberCheck = await userRepository.getUserByNumber(data.number);
    // if (numberCheck) {
    //   throw new Error("Number already in use");
    // }
    // hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10); // 10 complexity
    data.password = hashedPassword;

    // create user
    const newUser = await userRepository.createUser(data);
    return newUser;
  }

  async loginUser(data: LoginUserDTO) {
    const user = await userRepository.getUserByEmail(data.email);
    if(!user) {
      throw new HttpError(404, "User not found");
    }
    // Compare password
    const validPassword = await bcryptjs.compare(data.password, user.password);
    // plaintext, hashed
    if(!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }
    // generate jwt
    const payload = { // User identifier
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role
    }

    const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '30d'});
    return { token, user }
  }

  async updateUser(id: string, data: UpdateUserDTO){
        const user = await userRepository.getUserByEmail(id);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        if(user.email !== data.email){
            const emailCheck = await userRepository.getUserByEmail(data.email!);
            if(emailCheck){
                throw new HttpError(403, "Email already in use");
            }
        }
        if(data.password){
            // hash new password
            const hashedPassword = await bcryptjs.hash(data.password, 10);
            data.password = hashedPassword;
        }
        const updatedUser = await userRepository.updateUser(id, data);
        return updatedUser;
    }

  async getUserbyEmail(email: string) {
    const user = await userRepository.getUserByEmail(email);
    return user;
  }

  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user){
      throw new HttpError(404, "User not found");
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    await sendEmail(user.email, "Password Reset", html);
    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
        try {
            if (!token || !newPassword) {
                throw new HttpError(400, "Token and new password are required");
            }
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.id;
            const user = await userRepository.getUserbyId(userId);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            const hashedPassword = await bcryptjs.hash(newPassword, 10);
            await userRepository.updateUser(userId, { password: hashedPassword });
            return user;
        } catch (error) {
            throw new HttpError(400, "Invalid or expired token");
        }
    }

    async getUserReportStats(id: string) {
        const stats = await userRepository.getUserReportStats(id);
        return stats;
    }

    async getAuthorityStats(id: string) {
      const user = await userRepository.getUserbyId(id);
      if (!user) {
          throw new HttpError(404, "User not found");
      }
      if (user.role !== 'authority') {
          throw new HttpError(403, "Access denied - not an authority user");
      }

      return {
          assignedIssues: user.assignedIssuesCount || 0,
          completedIssues: user.completedIssuesCount || 0,
          department: user.department,
          phoneNumber: user.phoneNumber,
          employeeId: user.employeeId,
      };
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
          // Check if manually entered employeeId already exists (only if provided)
          const employeeIdCheck = await userRepository.getUserByEmployeeId(employeeId);
          if (employeeIdCheck) {
              throw new HttpError(400, "Employee ID already in use");
          }
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(data.password, 10);
      
      // Create authority user with default values
      const authorityData = {
          ...data,
          employeeId, // Use the generated or validated employeeId
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

    async updateProfile(userId: string, updateData: Partial<IUser>) {
        const user = await userRepository.getUserbyId(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        // Delete old profile picture file if replacing or removing
        if ((updateData.profilePicture !== undefined) && user.profilePicture) {
            const oldFilePath = path.join(__dirname, '../../uploads', user.profilePicture);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath); // clean up old file from disk
            }
        }

        const updatedUser = await userRepository.updateUser(userId, updateData);
        return updatedUser;
    }
}

