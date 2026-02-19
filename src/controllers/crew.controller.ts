import { CrewService } from "../services/crew.service";
import { CreateCrewDTO, UpdateCrewDTO, AssignCrewToIssueDTO } from "../dtos/crew.dto";
import { Request, Response } from "express";
import z from "zod";
import { IUser } from "../models/user.model";

let crewService = new CrewService();

interface QueryParams {
    page?: string;
    size?: string;
    status?: string;
    department?: string;
}

export class CrewController {
    async createCrew(req: Request, res: Response) {
        try {
            const parsedData = CreateCrewDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const authorityId = (req.user as IUser)?._id.toString();
            if (!authorityId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const crewData: CreateCrewDTO = parsedData.data;
            const newCrew = await crewService.createCrew(crewData, authorityId);

            return res.status(201).json({
                success: true,
                message: "Crew created successfully",
                data: newCrew
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async getCrewById(req: Request, res: Response) {
        try {
            const crewId = req.params.id;
            const crew = await crewService.getCrewById(crewId);

            return res.status(200).json({
                success: true,
                message: "Crew fetched successfully",
                data: crew
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async getAllCrews(req: Request, res: Response) {
        try {
            const authorityId = (req.user as IUser)?._id.toString();
            if (!authorityId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const { page, size, status, department }: QueryParams = req.query;

            const { crews, pagination } = await crewService.getAllCrews(
                authorityId,
                page,
                size,
                status,
                department
            );

            return res.status(200).json({
                success: true,
                data: crews,
                pagination: pagination,
                message: "Crews retrieved successfully"
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async getAvailableCrews(req: Request, res: Response) {
        try {
            const authorityId = (req.user as IUser)?._id.toString();
            if (!authorityId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const department = req.query.department as string | undefined;
            const crews = await crewService.getAvailableCrews(authorityId, department);

            return res.status(200).json({
                success: true,
                data: crews,
                message: "Available crews retrieved successfully"
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async updateCrew(req: Request, res: Response) {
        try {
            const crewId = req.params.id;
            const parsedData = UpdateCrewDTO.safeParse(req.body);

            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const authorityId = (req.user as IUser)?._id.toString();
            if (!authorityId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const updateData: UpdateCrewDTO = parsedData.data;
            const updatedCrew = await crewService.updateCrew(crewId, updateData, authorityId);

            return res.status(200).json({
                success: true,
                message: "Crew updated successfully",
                data: updatedCrew
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async deleteCrew(req: Request, res: Response) {
        try {
            const crewId = req.params.id;
            const authorityId = (req.user as IUser)?._id.toString();
            if (!authorityId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const result = await crewService.deleteCrew(crewId, authorityId);

            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async assignCrewToIssue(req: Request, res: Response) {
        try {
            const crewId = req.params.id;
            const parsedData = AssignCrewToIssueDTO.safeParse(req.body);

            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error)
                });
            }

            const authorityId = (req.user as IUser)?._id.toString();
            if (!authorityId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const { issueId } = parsedData.data;
            const updatedCrew = await crewService.assignCrewToIssue(crewId, issueId, authorityId);

            return res.status(200).json({
                success: true,
                message: "Crew assigned to issue successfully",
                data: updatedCrew
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    async releaseCrewFromIssue(req: Request, res: Response) {
        try {
            const crewId = req.params.id;
            const authorityId = (req.user as IUser)?._id.toString();
            if (!authorityId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const updatedCrew = await crewService.releaseCrewFromIssue(crewId, authorityId);

            return res.status(200).json({
                success: true,
                message: "Crew released from issue successfully",
                data: updatedCrew
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }
}