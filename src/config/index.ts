import dotenv from "dotenv";
dotenv.config();

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const MONGODB_URI: string = "mongodb://localhost:27017/defaultdb"

export const JWT_SECRET: string = 
    process.env.JWT_SECRET || 'default'

export const CLIENT_URL: string =
process.env.CLIENT_URL || 'http://localhost:3000';
   
export const EMAIL_USER: string =
    process.env.EMAIL_USER || 'achaulagain.mail123@gmail.com'

export const EMAIL_PASS: string =
    process.env.EMAIL_PASS || 'password';