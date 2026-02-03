import jwt from "jsonwebtoken";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../../dtos/user.dto";
import { HttpError } from "../../errors/http-error";
import { UserRepository } from "../../repositories/user.repository";
import { JWT_SECRET } from "../../config";
import bcrypt from "bcryptjs/umd/types";

let userRepository = new UserRepository();

export class AdminUserService {
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
        const hashedPassword = await bcrypt.hash(data.password, 10); // 10 complexity
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
          const validPassword = await bcrypt.compare(data.password, user.password);
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

    async getAllUsers(){
        const users = await userRepository.getAllUsers();
        return users;
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
                const hashedPassword = await bcrypt.hash(data.password, 10);
                data.password = hashedPassword;
            }
            const updatedUser = await userRepository.updateUser(id, data);
            return updatedUser;
        }
    
      async getUserbyEmail(email: string) {
        const user = await userRepository.getUserByEmail(email);
        return user;
      }
}