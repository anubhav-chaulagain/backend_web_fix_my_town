import { CreateCrewDTO, UpdateCrewDTO } from "../dtos/crew.dto";
import { HttpError } from "../errors/http-error";
import { CrewRepository } from "../repositories/crew.repository";
import { Types } from "mongoose";
import { UserRepository } from "../repositories/user.repository";

let crewRepository = new CrewRepository();
let userRepository = new UserRepository();

export class CrewService {
    async createCrew(data: CreateCrewDTO, authorityId: string) {
        const crewData: any = {
            ...data,
            authorityId: new Types.ObjectId(authorityId)
        };

        const newCrew = await crewRepository.createCrew(crewData);
        return newCrew;
    }

    async getCrewById(id: string) {
        const crew = await crewRepository.getCrewById(id);
        if (!crew) {
            throw new HttpError(404, "Crew not found");
        }
        return crew;
    }

    async getAllCrews(
        authorityId: string,
        page?: string,
        size?: string,
        status?: string,
        department?: string
    ) {
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;

        const filters = { status, department };

        const { crews, total } = await crewRepository.getAllCrews(
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

        return { crews, pagination };
    }

    async updateCrew(id: string, data: UpdateCrewDTO, authorityId: string) {
        const crew = await crewRepository.getCrewById(id);
        if (!crew) {
            throw new HttpError(404, "Crew not found");
        }

        // Check if crew belongs to this authority
        if (crew.authorityId.toString() !== authorityId) {
            throw new HttpError(403, "You can only update your own crews");
        }

        const updatedCrew = await crewRepository.updateCrew(id, data);
        return updatedCrew;
    }

    async deleteCrew(id: string, authorityId: string) {
        const crew = await crewRepository.getCrewById(id);
        if (!crew) {
            throw new HttpError(404, "Crew not found");
        }

        // Check if crew belongs to this authority
        if (crew.authorityId.toString() !== authorityId) {
            throw new HttpError(403, "You can only delete your own crews");
        }

        // Don't allow deletion if crew is on task
        if (crew.status === 'on-task') {
            throw new HttpError(400, "Cannot delete crew that is currently on task");
        }

        const result = await crewRepository.deleteCrew(id);
        if (!result) {
            throw new HttpError(500, "Failed to delete crew");
        }

        return { message: "Crew deleted successfully" };
    }

    async getActiveCrewCount(authorityId: string) {
        const count = await crewRepository.getActiveCrewCount(authorityId);
        return count;
    }

    async getAvailableCrews(authorityId: string, department?: string) {
        const crews = await crewRepository.getAvailableCrews(authorityId, department);
        return crews;
    }

    async assignCrewToIssue(crewId: string, issueId: string, authorityId: string) {
        const crew = await crewRepository.getCrewById(crewId);
        if (!crew) {
            throw new HttpError(404, "Crew not found");
        }

        if (crew.authorityId.toString() !== authorityId) {
            throw new HttpError(403, "You can only assign your own crews");
        }

        if (crew.status !== 'available') {
            throw new HttpError(400, "Crew is not available");
        }

        const updatedCrew = await crewRepository.assignCrewToIssue(crewId, issueId);
        return updatedCrew;
    }

    async releaseCrewFromIssue(crewId: string, authorityId: string) {
        const crew = await crewRepository.getCrewById(crewId);
        if (!crew) {
            throw new HttpError(404, "Crew not found");
        }

        if (crew.authorityId.toString() !== authorityId) {
            throw new HttpError(403, "You can only manage your own crews");
        }

        const updatedCrew = await crewRepository.releaseCrewFromIssue(crewId);
        return updatedCrew;
    }

    
    async getAuthorityStats(id: string) {
        const user = await userRepository.getUserbyId(id);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        if (user.role !== 'authority') {
            throw new HttpError(403, "Access denied - not an authority user");
        }

        // Calculate active crew count dynamically
        const activeCrewCount = await crewRepository.getActiveCrewCount(id);

        return {
            assignedIssues: user.assignedIssuesCount || 0,
            completedIssues: user.completedIssuesCount || 0,
            activeCrew: activeCrewCount, // Dynamic count
            department: user.department,
            phoneNumber: user.phoneNumber,
            employeeId: user.employeeId,
        };
    }
}