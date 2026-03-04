import { QueryFilter } from "mongoose";
import { IUser, UserModel } from "../models/user.model";

export interface IUserRepository {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserByEmail(email: String): Promise<IUser | null>;
    // getUserByNumber(number: String): Promise<IUser | null>;
    // Additional
    getUserbyId(id: string): Promise<IUser | null>;
    getUserByEmployeeId(employeeId: string): Promise<IUser | null>;
    getAllUsers(
        page: number, size: number, search?: string
    ): Promise<{users: IUser[], total: number}>;
    getUsersByRole(role: string): Promise<IUser[]>;
    deleteUser(id:string): Promise<boolean>;
    updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;

    getUserReportStats(id: string): Promise<{
        totalReports: number;
        pendingReports: number;
        resolvedReports: number;
        inprogressReports: number;
    }>;

    updateTotalReports(id: string): Promise<void>;
    updatePendingReports(id: string): Promise<void>;
    updateResolvedReports(id: string): Promise<void>;
    updateInProgressReports(id: string): Promise<void>;

    incrementAuthorityStats(id: string, field: 'assignedIssuesCount' | 'completedIssuesCount'): Promise<void>;
    decrementAuthorityStats(id: string, field: 'assignedIssuesCount' | 'completedIssuesCount'): Promise<void>;
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
    // async getUserByNumber(number: String): Promise<IUser | null> {
    //     const user = await UserModel.findOne({"number":number});
    //     return user;
    // }
    async getUserbyId(id: string): Promise<IUser | null> {
        // UserModel.findOne({"_id": id});
        const user = await UserModel.findById(id);
        return user;
    }

    async getAllUsers(
        page: number, size: number, search?: string
    ): Promise<{users: IUser[], total: number}> {
        const filter: QueryFilter<IUser> = {};
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
            ];
        }
        const [users, total] = await Promise.all([
            UserModel.find(filter)
                .skip((page - 1) * size)
                .limit(size),
            UserModel.countDocuments(filter)
        ]);
        return { users, total };
    }
    
    async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
        // UserModel.updateOne({ _id: id }, { $set: updateData });
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

    async getUserReportStats(id: string): Promise<{
        totalReports: number;
        pendingReports: number;
        resolvedReports: number;
        inprogressReports: number;
    }> {
        const user = await UserModel.findById(id);
        return {
            totalReports: user?.totalReports || 0,
            pendingReports: user?.pendingReports || 0,
            resolvedReports: user?.resolvedReports || 0,
            inprogressReports: user?.inprogressReports || 0
        };
        
    }

    async updateTotalReports(id: string): Promise<void> {
        await UserModel.findByIdAndUpdate(id, { $inc: { totalReports: 1 } });
    }

    async updatePendingReports(id: string): Promise<void> {
        await UserModel.findByIdAndUpdate(id, { $inc: { pendingReports: 1 } });
    }

    async updateResolvedReports(id: string): Promise<void> {
        await UserModel.findByIdAndUpdate(id, { $inc: { resolvedReports: 1 } });
    }

    async updateInProgressReports(id: string): Promise<void> {
        await UserModel.findByIdAndUpdate(id, { $inc: { inprogressReports: 1 } });
    }

    async getUserByEmployeeId(employeeId: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ employeeId });
        return user;
    }

    async incrementAuthorityStats(
        id: string, 
        field: 'assignedIssuesCount' | 'completedIssuesCount'
    ): Promise<void> {
        await UserModel.findByIdAndUpdate(id, { $inc: { [field]: 1 } });
    }

    async decrementAuthorityStats(
        id: string, 
        field: 'assignedIssuesCount' | 'completedIssuesCount'
    ): Promise<void> {
        await UserModel.findByIdAndUpdate(id, { $inc: { [field]: -1 } });
    }

    async getUsersByRole(role: string): Promise<IUser[]> {
        return await UserModel.find({ role }).sort({ fullname: 1 });
    }

};