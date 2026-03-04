import mongoose, { QueryFilter } from "mongoose";
import { IIssue, IssueModel } from "../models/issue.model";

export interface IIssueRepository {
    createIssue(issueData: Partial<IIssue>): Promise<IIssue>;
    getIssueById(id: string): Promise<IIssue | null>;
    getAllIssues(
        page: number, 
        size: number, 
        filters?: {
            status?: string;
            category?: string;
            priority?: string;
            reportedBy?: string;
            assignedTo?: string;
            search?: string;
        }
    ): Promise<{ issues: IIssue[], total: number }>;
    getIssuesByUser(
        userId: string,
        page: number,
        size: number
    ): Promise<{ issues: IIssue[], total: number }>;
    getIssuesByStatus(
        status: string,
        page: number,
        size: number
    ): Promise<{ issues: IIssue[], total: number }>;
    getUnassignedIssues(limit: number): Promise<IIssue[]>;
    updateIssue(id: string, updateData: Partial<IIssue>): Promise<IIssue | null>;
    updateIssueStatus(id: string, status: string, remarks?: string): Promise<IIssue | null>;
    assignIssue(id: string, assignedTo: string): Promise<IIssue | null>;
    resolveIssue(id: string, remarks?: string): Promise<IIssue | null>;
    deleteIssue(id: string): Promise<boolean>;
    getMyRecentIssues(userId: string): Promise<IIssue[]>;
    getAssignedIssues(
        authorityId: string,
        page: number,
        size: number,
        filters?: {
            status?: string;
            category?: string;
            priority?: string;
            search?: string;
        }
    ): Promise<{ issues: IIssue[], total: number }>;
    getAdminStats(): Promise<{
        totalReports: number;
        unassignedReports: number;
        pendingReports: number;
        inprogressReports: number;
        resolvedReports: number;
    }>;
}

// MongoDB implementation of IssueRepository
export class IssueRepository implements IIssueRepository {
    async createIssue(issueData: Partial<IIssue>): Promise<IIssue> {
        const issue = new IssueModel(issueData);
        return await issue.save();
    }

    async getIssueById(id: string): Promise<IIssue | null> {
        const issue = await IssueModel.findById(id)
            .populate('reportedBy', 'fullname email')
            .populate('assignedTo', 'fullname email');
        return issue;
    }

    async getAllIssues(
        page: number, 
        size: number, 
        filters?: {
            status?: string;
            category?: string;
            priority?: string;
            reportedBy?: string;
            assignedTo?: string;
            search?: string;
        }
    ): Promise<{ issues: IIssue[], total: number }> {
        const filter: QueryFilter<IIssue> = {};

        // Apply filters
        if (filters?.status) {
            filter.status = filters.status;
        }
        if (filters?.category) {
            filter.category = filters.category;
        }
        if (filters?.priority) {
            filter.priority = filters.priority;
        }
        if (filters?.reportedBy) {
            filter.reportedBy = filters.reportedBy;
        }
        if (filters?.assignedTo) {
            filter.assignedTo = filters.assignedTo;
        }

        // Search functionality
        if (filters?.search) {
            filter.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
                { location: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const [issues, total] = await Promise.all([
            IssueModel.find(filter)
                .populate('reportedBy', 'fullname email')
                .populate('assignedTo', 'fullname email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * size)
                .limit(size),
            IssueModel.countDocuments(filter)
        ]);

        return { issues, total };
    }

    async getIssuesByUser(
        userId: string,
        page: number,
        size: number
    ): Promise<{ issues: IIssue[], total: number }> {
        const filter: QueryFilter<IIssue> = { reportedBy: userId };

        const [issues, total] = await Promise.all([
            IssueModel.find(filter)
                .populate('assignedTo', 'fullname email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * size)
                .limit(size),
            IssueModel.countDocuments(filter)
        ]);

        return { issues, total };
    }

    async getIssuesByStatus(
        status: string,
        page: number,
        size: number
    ): Promise<{ issues: IIssue[], total: number }> {
        const filter: QueryFilter<IIssue> = { status };

        const [issues, total] = await Promise.all([
            IssueModel.find(filter)
                .populate('reportedBy', 'fullname email')
                .populate('assignedTo', 'fullname email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * size)
                .limit(size),
            IssueModel.countDocuments(filter)
        ]);

        return { issues, total };
    }

    async getUnassignedIssues(limit: number): Promise<IIssue[]> {
        const issues = await IssueModel.find({
            assignedTo: { $exists: false },   // covers documents where field is absent
            // status: 'pending'
        })
            .populate('reportedBy', 'fullname email')
            .sort({ createdAt: -1 })
            .limit(limit);
        return issues;
    }

    async updateIssue(id: string, updateData: Partial<IIssue>): Promise<IIssue | null> {
        const updatedIssue = await IssueModel.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true } // return the updated document
        )
        .populate('reportedBy', 'fullname email')
        .populate('assignedTo', 'fullname email');
        
        return updatedIssue;
    }

    async updateIssueStatus(id: string, status: string, remarks?: string): Promise<IIssue | null> {
        const updateData: Partial<IIssue> = { 
            status: status as any
        };
        
        if (remarks) {
            updateData.remarks = remarks;
        }

        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
        }

        const updatedIssue = await IssueModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate('reportedBy', 'fullname email')
        .populate('assignedTo', 'fullname email');

        return updatedIssue;
    }

    async assignIssue(id: string, assignedTo: string): Promise<IIssue | null> {
        const updateData: Partial<IIssue> = { 
            assignedTo: assignedTo as any,
            status: 'in-progress' as any
        };

        const updatedIssue = await IssueModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate('reportedBy', 'fullname email')
        .populate('assignedTo', 'fullname email');

        return updatedIssue;
    }

    async resolveIssue(id: string, remarks?: string): Promise<IIssue | null> {
        const updateData: Partial<IIssue> = {
            status: 'resolved' as any,
            resolvedAt: new Date()
        };

        if (remarks) {
            updateData.remarks = remarks;
        }

        const updatedIssue = await IssueModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate('reportedBy', 'fullname email')
        .populate('assignedTo', 'fullname email');

        return updatedIssue;
    }

    async deleteIssue(id: string): Promise<boolean> {
        const result = await IssueModel.findByIdAndDelete(id);
        return result ? true : false;
    }

    async getMyRecentIssues(userId: string): Promise<IIssue[]> {
    const issues = await IssueModel.find({ reportedBy: userId })
        .populate('reportedBy', 'fullname email')
        .populate('assignedTo', 'fullname email')
        .sort({ createdAt: -1 }) // latest first
        .limit(5);
    return issues;
}

async getAssignedIssues(
    authorityId: string,
    page: number,
    size: number,
    filters?: {
        status?: string;
        category?: string;
        priority?: string;
        search?: string;
    }
): Promise<{ issues: IIssue[], total: number }> {
    const query: any = { assignedTo: new mongoose.Types.ObjectId(authorityId) };

    if (filters?.status) {
        query.status = filters.status;
    }
    if (filters?.category) {
        query.category = filters.category;
    }
    if (filters?.priority) {
        query.priority = filters.priority;
    }
    if (filters?.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } },
            { location: { $regex: filters.search, $options: 'i' } }
        ];
    }

    const [issues, total] = await Promise.all([
        IssueModel.find(query)
            .populate('reportedBy', 'fullname email')
            .populate('assignedTo', 'fullname email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * size)
            .limit(size),
        IssueModel.countDocuments(query)
    ]);

    return { issues, total };
}

async getAdminStats() {
    const [
        totalReports,
        unassignedReports,
        pendingReports,
        inprogressReports,
        resolvedReports,
    ] = await Promise.all([
        IssueModel.countDocuments({}),
        IssueModel.countDocuments({ assignedTo: { $exists: false } }),
        IssueModel.countDocuments({ status: 'pending' }),
        IssueModel.countDocuments({ status: 'in-progress' }),
        IssueModel.countDocuments({ status: 'resolved' }),
    ]);

    return {
        totalReports,
        unassignedReports,
        pendingReports,
        inprogressReports,
        resolvedReports,
    };
}
}