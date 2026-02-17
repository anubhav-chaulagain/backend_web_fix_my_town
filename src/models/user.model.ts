import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const UserSchema: Schema = new Schema<UserType>(
    {
        fullname: { type: String, required: true, unique: true},
        email: { type: String, required: true, unique: true},
        password: { type: String, required: true},
        role: {
            type: String,
            default: 'citizen'
        },
        profilePicture: { type: String, required: false},
        // Report Stats
        totalReports: { type: Number, default: 0 },
        pendingReports: { type: Number, default: 0 },
        resolvedReports: { type: Number, default: 0 },
        inprogressReports: { type: Number, default: 0 },
    },
    {
        timestamps: true, // auto createdAt and updatedAt
    }
);

export interface IUser extends UserType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
// UserModel is the mongoose model for User collection
// db.users in MongoDB