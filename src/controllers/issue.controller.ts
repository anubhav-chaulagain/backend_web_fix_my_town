import { IssueService } from "../services/issue.service";
import { CreateIssueDTO, UpdateIssueDTO } from "../dtos/issue.dto";
import { Request, Response } from "express";
import z from "zod";
import { IUser } from "../models/user.model";

let issueService = new IssueService();

interface QueryParams {
    page?: string;
    size?: string;
    status?: string;
    category?: string;
    priority?: string;
    reportedBy?: string;
    assignedTo?: string;
    search?: string;
}

export class IssueController {
    async createIssue(req: Request, res: Response) {
        try {
            const parsedData = CreateIssueDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const userId = (req.user as IUser)?._id.toString();
            if (!userId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }

            const issueData: CreateIssueDTO = parsedData.data;
            const newIssue = await issueService.createIssue(issueData, userId);

            return res.status(201).json(
                { success: true, message: "Issue reported successfully", data: newIssue }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getIssueById(req: Request, res: Response) {
        try {
            const issueId = req.params.id;
            const issue = await issueService.getIssueById(issueId);

            return res.status(200).json(
                { success: true, message: "Issue fetched successfully", data: issue }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getAllIssues(req: Request, res: Response) {
        try {
            const { page, size, status, category, priority, reportedBy, assignedTo, search }: QueryParams = req.query;
            
            const { issues, pagination } = await issueService.getAllIssues(
                page, size, status, category, priority, reportedBy, assignedTo, search
            );

            return res.status(200).json(
                { success: true, data: issues, pagination: pagination, message: "Issues retrieved successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getUserIssues(req: Request, res: Response) {
        try {
            const userId = (req.user as IUser)?._id.toString();
            if (!userId) {
                return res.status(401).json(
                    { success: false, message: "User not authenticated" }
                );
            }

            const { page, size }: QueryParams = req.query;
            const { issues, pagination } = await issueService.getIssuesByUser(userId, page, size);

            return res.status(200).json(
                { success: true, data: issues, pagination: pagination, message: "User issues retrieved successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async updateIssue(req: Request, res: Response) {
        try {
            const issueId = req.params.id;
            const parsedData = UpdateIssueDTO.safeParse(req.body);
            
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const updateData: UpdateIssueDTO = parsedData.data;
            const updatedIssue = await issueService.updateIssue(issueId, updateData);

            return res.status(200).json(
                { success: true, message: "Issue updated successfully", data: updatedIssue }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async updateIssueStatus(req: Request, res: Response) {
        try {
            const issueId = req.params.id;
            const { status, remarks } = req.body;

            if (!status) {
                return res.status(400).json(
                    { success: false, message: "Status is required" }
                );
            }

            const updatedIssue = await issueService.updateIssueStatus(issueId, status, remarks);

            return res.status(200).json(
                { success: true, message: "Issue status updated successfully", data: updatedIssue }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async assignIssue(req: Request, res: Response) {
        try {
            const issueId = req.params.id;
            const { assignedTo, priority } = req.body;

            if (!assignedTo) {
                return res.status(400).json(
                    { success: false, message: "assignedTo is required" }
                );
            }

            const updatedIssue = await issueService.assignIssue(issueId, assignedTo, priority);

            return res.status(200).json(
                { success: true, message: "Issue assigned successfully", data: updatedIssue }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async resolveIssue(req: Request, res: Response) {
        try {
            const issueId = req.params.id;
            const { remarks } = req.body;

            const updatedIssue = await issueService.resolveIssue(issueId, remarks);

            return res.status(200).json(
                { success: true, message: "Issue resolved successfully", data: updatedIssue }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async deleteIssue(req: Request, res: Response) {
        try {
            const issueId = req.params.id;
            const result = await issueService.deleteIssue(issueId);

            return res.status(200).json(
                { success: true, message: result.message }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}