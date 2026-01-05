import { IUser, UserModel } from "../models/user.model";

export interface IUserRepository {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserByEmail(email: String): Promise<IUser | null>;
    getUserByNumber(number: String): Promise<IUser | null>;
    // Additional
    getUserbyId(id: string): Promise<IUser | null>;
    getAllUsers(): Promise<IUser[]>;
    updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
    deleteUser(id:string): Promise<boolean>;
};

// MongoDB implementation of UserRepository
export class UserRepository implements IUserRepository {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData);
        return await user.save();
    }
    async getUserByEmail(email: String): Promise<IUser | null> {
        const user = await UserModel.findOne({"email": email});
        return user;
    }
    async getUserByNumber(number: String): Promise<IUser | null> {
        const user = await UserModel.findOne({"number":number});
        return user;
    }
    async getUserbyId(id: string): Promise<IUser | null> {
        // UserModel.findOne({"_id": id});
        const user = await UserModel.findById(id);
        return user;
    }
    async getAllUsers(): Promise<IUser[]> {
        const users = await UserModel.find();
        return users;
    }
    async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
        //UserModel.updateOne({_id: id}, {$set: updateData});
        const updatedUser = await UserModel.findByIdAndUpdate(
            id, updateData, { new: true } // return the updated document
        );
        return updatedUser;
    }
    async deleteUser(id: string): Promise<boolean> {
        // UserModel.deleteONe({ _id: id});
        const result  = await UserModel.findByIdAndDelete(id);
        return result ? true: false;
    }   
};