import mongoose from "mongoose";
import { CrewModel, ICrew } from "../models/crew.model";

export interface ICrewRepository {
    createCrew(crewData: Partial<ICrew>): Promise<ICrew>;
    getCrewById(id: string): Promise<ICrew | null>;
    getAllCrews(
        authorityId: string,
        page: number,
        size: number,
        filters?: {
            status?: string;
            department?: string;
        }
    ): Promise<{ crews: ICrew[], total: number }>;
    updateCrew(id: string, updateData: Partial<ICrew>): Promise<ICrew | null>;
    deleteCrew(id: string): Promise<boolean>;
    getActiveCrewCount(authorityId: string): Promise<number>;
    getAvailableCrews(authorityId: string, department?: string): Promise<ICrew[]>;
    assignCrewToIssue(crewId: string, issueId: string): Promise<ICrew | null>;
    releaseCrewFromIssue(crewId: string): Promise<ICrew | null>;
}

export class CrewRepository implements ICrewRepository {
    async createCrew(crewData: Partial<ICrew>): Promise<ICrew> {
        const crew = new CrewModel(crewData);
        return await crew.save();
    }

    async getCrewById(id: string): Promise<ICrew | null> {
        const crew = await CrewModel.findById(id)
            .populate('authorityId', 'fullname email department')
            .populate('currentIssueId');
        return crew;
    }

    async getAllCrews(
        authorityId: string,
        page: number,
        size: number,
        filters?: {
            status?: string;
            department?: string;
        }
    ): Promise<{ crews: ICrew[], total: number }> {
        const query: any = { authorityId: new mongoose.Types.ObjectId(authorityId) };

        if (filters?.status) {
            query.status = filters.status;
        }
        if (filters?.department) {
            query.department = filters.department;
        }

        const [crews, total] = await Promise.all([
            CrewModel.find(query)
                .populate('authorityId', 'fullname email')
                .populate('currentIssueId', 'title status')
                .sort({ createdAt: -1 })
                .skip((page - 1) * size)
                .limit(size),
            CrewModel.countDocuments(query)
        ]);

        return { crews, total };
    }

    async updateCrew(id: string, updateData: Partial<ICrew>): Promise<ICrew | null> {
        const updatedCrew = await CrewModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate('authorityId', 'fullname email')
        .populate('currentIssueId', 'title status');
        
        return updatedCrew;
    }

    async deleteCrew(id: string): Promise<boolean> {
        const result = await CrewModel.findByIdAndDelete(id);
        return result ? true : false;
    }

    async getActiveCrewCount(authorityId: string): Promise<number> {
        const count = await CrewModel.countDocuments({
            authorityId: new mongoose.Types.ObjectId(authorityId),
            status: { $in: ['available', 'on-task'] } // not off-duty
        });
        return count;
    }

    async getAvailableCrews(authorityId: string, department?: string): Promise<ICrew[]> {
        const query: any = {
            authorityId: new mongoose.Types.ObjectId(authorityId),
            status: 'available'
        };

        if (department) {
            query.department = department;
        }

        const crews = await CrewModel.find(query)
            .populate('authorityId', 'fullname email');
        return crews;
    }

    async assignCrewToIssue(crewId: string, issueId: string): Promise<ICrew | null> {
        const updatedCrew = await CrewModel.findByIdAndUpdate(
            crewId,
            {
                status: 'on-task',
                currentIssueId: new mongoose.Types.ObjectId(issueId)
            },
            { new: true }
        )
        .populate('authorityId', 'fullname email')
        .populate('currentIssueId', 'title status');

        return updatedCrew;
    }

    async releaseCrewFromIssue(crewId: string): Promise<ICrew | null> {
        const updatedCrew = await CrewModel.findByIdAndUpdate(
            crewId,
            {
                status: 'available',
                currentIssueId: undefined
            },
            { new: true }
        )
        .populate('authorityId', 'fullname email');

        return updatedCrew;
    }
}