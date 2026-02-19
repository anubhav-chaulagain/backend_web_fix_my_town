import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const UserSchema: Schema = new Schema<UserType>(
    {
        fullname: { type: String, required: true, unique: true},
        email: { type: String, required: true, unique: true},
        password: { type: String, required: true},
        role: {
            type: String,
            default: 'citizen',
            enum: ['citizen', 'authority']
        },
        profilePicture: { type: String, required: false},
        
        // Citizen Stats
        totalReports: { type: Number, default: 0 },
        pendingReports: { type: Number, default: 0 },
        resolvedReports: { type: Number, default: 0 },
        inprogressReports: { type: Number, default: 0 },
        
        // Authority-specific fields
        department: { 
            type: String, 
            required: function(this: any): boolean { 
                return this.role === 'authority'; 
            }
        },
        employeeId: { 
            type: String, 
            required: function(this: any): boolean { 
                return this.role === 'authority'; 
            },
            unique: true,
            sparse: true
        },
        assignedIssuesCount: { type: Number, default: 0 },
        completedIssuesCount: { type: Number, default: 0 },
        phoneNumber: { type: String },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

export interface IUser extends UserType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);