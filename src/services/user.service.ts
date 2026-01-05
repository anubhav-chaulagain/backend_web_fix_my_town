import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

let userRepository = new UserRepository();

export class UserService {
  async createUser(data: CreateUserDTO) {
    // business logic before creating user
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if(emailCheck) {
      throw new Error("Email already in use");
    }

    const numberCheck = await userRepository.getUserByNumber(data.number);
    if (numberCheck) {
      throw new Error("Number already in use");
    }
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
      number: user.number,
      role: user.role
    }

    const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '30d'});
    return { token, user }
  }
}