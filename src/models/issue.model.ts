import mongoose, { Document, Schema } from "mongoose";

const IssueSchema: Schema = new Schema(
    {
        title: { 
            type: String, 
            required: true,
            minlength: 5,
            maxlength: 100
        },
        category: { 
            type: String, 
            required: true,
            enum: ['Pothole', 'Broken Streetlight', 'Garbage', 'Water Leakage', 'Other']
        },
        location: { 
            type: String, 
            required: true,
            minlength: 5,
            maxlength: 200
        },
        latitude: { 
            type: Number, 
            required: false,
            min: -90,
            max: 90
        },
        longitude: { 
            type: Number, 
            required: false,
            min: -180,
            max: 180
        },
        description: { 
            type: String, 
            required: true,
            minlength: 10,
            maxlength: 1000
        },
        issueImages: [{ 
            type: String, 
            required: false 
        }],
        status: { 
            type: String, 
            default: 'pending',
            enum: ['pending', 'in-progress', 'resolved', 'rejected']
        },
        priority: { 
            type: String, 
            default: 'medium',
            enum: ['low', 'medium', 'high', 'urgent']
        },
        reportedBy: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        assignedTo: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: false 
        },
        resolvedAt: { 
            type: Date, 
            required: false 
        },
        remarks: { 
            type: String, 
            required: false,
            maxlength: 500
        },
    },
    {
        timestamps: true, // auto createdAt and updatedAt
    }
);

// Index for faster queries
IssueSchema.index({ status: 1, category: 1 });
IssueSchema.index({ reportedBy: 1 });
IssueSchema.index({ location: 1 });
IssueSchema.index({ createdAt: -1 });

export interface IIssue extends Document {
    title: string;
    category: 'Pothole' | 'Broken Streetlight' | 'Garbage' | 'Water Leakage' | 'Other';
    location: string;
    latitude?: number;
    longitude?: number;
    description: string;
    issueImages?: string[];
    status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reportedBy: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
    remarks?: string;
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const IssueModel = mongoose.model<IIssue>('Issue', IssueSchema);
// IssueModel is the mongoose model for Issue collection
// db.issues in MongoDB