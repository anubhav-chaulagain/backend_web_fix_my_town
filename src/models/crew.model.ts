import mongoose, { Document, Schema } from "mongoose";

const CrewSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        authorityId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        members: [{ type: String }], // crew member names
        currentIssueId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Issue',
            required: false
        },
        status: {
            type: String,
            enum: ['available', 'on-task', 'off-duty'],
            default: 'available'
        },
        department: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

export interface ICrew extends Document {
    name: string;
    authorityId: mongoose.Types.ObjectId;
    members: string[];
    currentIssueId?: mongoose.Types.ObjectId;
    status: 'available' | 'on-task' | 'off-duty';
    department: string;
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const CrewModel = mongoose.model<ICrew>('Crew', CrewSchema);