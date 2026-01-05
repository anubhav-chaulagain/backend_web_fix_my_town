import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const UserSchema: Schema = new Schema<UserType>(
    {
        fullname: { type: String, required: true, unique: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        number: {type: String, unique: true},
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
    },
    {
        timestamps: true, // auto createdAt and updatedAt
    }
);

export interface IUser extends UserType, Document { // combine UserType and Document
    _id: mongoose.Types.ObjectId; // mongo related attribute / custom attributes
    createdAt: Date;
    updatedAt: Date;
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
// UserModel is the mongoose model for User collection
// db.usres in MongoDB