import { CreateIssueDTO, UpdateIssueDTO } from "../dtos/issue.dto";
import { HttpError } from "../errors/http-error";
import { IssueRepository } from "../repositories/issue.repository";
import { Types } from "mongoose";
import { UserRepository } from "../repositories/user.repository";

let issueRepository = new IssueRepository();
let userRepository = new UserRepository();

export class IssueService {
    async createIssue(data: CreateIssueDTO, reportedBy: string) {
        const issueData: any = {
            ...data,
            reportedBy: new Types.ObjectId(reportedBy)
        };
        const newIssue = await issueRepository.createIssue(issueData);
        await userRepository.updateTotalReports(reportedBy);
        await userRepository.updatePendingReports(reportedBy);

        return newIssue;
    }

    async getIssueById(id: string) {
        const issue = await issueRepository.getIssueById(id);
        if (!issue) {
            throw new HttpError(404, "Issue not found");
        }
        return issue;
    }

    async getAllIssues(
        page?: string,
        size?: string,
        status?: string,
        category?: string,
        priority?: string,
        reportedBy?: string,
        assignedTo?: string,
        search?: string
    ) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;

        const filters = {
            status,
            category,
            priority,
            reportedBy,
            assignedTo,
            search
        };

        const { issues, total } = await issueRepository.getAllIssues(
            pageNumber,
            pageSize,
            filters
        );

        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize)
        };

        return { issues, pagination };
    }

    async getIssuesByUser(userId: string, page?: string, size?: string) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;

        const { issues, total } = await issueRepository.getIssuesByUser(
            userId,
            pageNumber,
            pageSize
        );

        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize)
        };

        return { issues, pagination };
    }

    async getUnassignedIssues(limit = 5) {
        const issues = await issueRepository.getUnassignedIssues(limit);
        return issues;
    }

    async updateIssue(id: string, data: UpdateIssueDTO) {
        const issue = await issueRepository.getIssueById(id);
        if (!issue) {
            throw new HttpError(404, "Issue not found");
        }

        const updateData: any = { ...data };
        if (updateData.reportedBy) {
            updateData.reportedBy = new Types.ObjectId(updateData.reportedBy);
        }
        if (updateData.assignedTo) {
            updateData.assignedTo = new Types.ObjectId(updateData.assignedTo);
        }

        const updatedIssue = await issueRepository.updateIssue(id, updateData);
        return updatedIssue;
    }

    async updateIssueStatus(id: string, status: string, remarks?: string) {
        const issue = await issueRepository.getIssueById(id);
        if (!issue) {
            throw new HttpError(404, "Issue not found");
        }

        const updatedIssue = await issueRepository.updateIssueStatus(id, status, remarks);
        return updatedIssue;
    }

    async deleteIssue(id: string) {
        const issue = await issueRepository.getIssueById(id);
        if (!issue) {
            throw new HttpError(404, "Issue not found");
        }

        const result = await issueRepository.deleteIssue(id);
        if (!result) {
            throw new HttpError(500, "Failed to delete issue");
        }
        return { message: "Issue deleted successfully" };
    }

    async getMyRecentIssues(userId: string) {
        const issues = await issueRepository.getMyRecentIssues(userId); // use repo directly
        return issues;
    }

    async assignIssue(id: string, assignedTo: string, priority?: string) {
        const issue = await issueRepository.getIssueById(id);
        if (!issue) {
            throw new HttpError(404, "Issue not found");
        }

        const updatedIssue = await issueRepository.assignIssue(id, assignedTo);

        await userRepository.incrementAuthorityStats(assignedTo, 'assignedIssuesCount');

        const reporterId = (issue.reportedBy as any)?._id
            ? (issue.reportedBy as any)._id.toString()
            : issue.reportedBy?.toString();

        if (reporterId) {
            await userRepository.updateInProgressReports(reporterId);
        }

        return updatedIssue;
    }

    async resolveIssue(id: string, remarks?: string) {
        const issue = await issueRepository.getIssueById(id);
        if (!issue) {
            throw new HttpError(404, "Issue not found");
        }

        const updatedIssue = await issueRepository.resolveIssue(id, remarks);

        const reporterId = (issue.reportedBy as any)?._id
            ? (issue.reportedBy as any)._id.toString()
            : issue.reportedBy?.toString();

        const authorityId = (issue.assignedTo as any)?._id
            ? (issue.assignedTo as any)._id.toString()
            : issue.assignedTo?.toString();

        if (reporterId) {
            await userRepository.updateResolvedReports(reporterId);
            await userRepository.decrementInProgressReports(reporterId);  // ← new
        }

        if (authorityId) {
            await userRepository.decrementAuthorityStats(authorityId, 'assignedIssuesCount');
            await userRepository.incrementAuthorityStats(authorityId, 'completedIssuesCount');
        }

        return updatedIssue;
    }

    async getMyAssignedIssues(
    authorityId: string,
    page?: string,
    size?: string,
    status?: string,
    category?: string,
    priority?: string,
    search?: string
) {
    const pageNumber = page ? parseInt(page) : 1;
    const pageSize = size ? parseInt(size) : 10;

    const filters = { status, category, priority, search };

    const { issues, total } = await issueRepository.getAssignedIssues(
        authorityId,
        pageNumber,
        pageSize,
        filters
    );

    const pagination = {
        page: pageNumber,
        size: pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    };

    return { issues, pagination };
}
}