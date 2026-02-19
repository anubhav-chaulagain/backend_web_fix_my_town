import { Router } from "express";
import { CrewController } from "../controllers/crew.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

let crewController = new CrewController();

const router = Router();

router.use(authorizedMiddleware); // All routes require authentication

// CRUD routes
router.post("/", crewController.createCrew);
router.get("/", crewController.getAllCrews);
router.get("/available", crewController.getAvailableCrews);
router.get("/:id", crewController.getCrewById);
router.put("/:id", crewController.updateCrew);
router.delete("/:id", crewController.deleteCrew);

// Assignment routes
router.patch("/:id/assign", crewController.assignCrewToIssue);
router.patch("/:id/release", crewController.releaseCrewFromIssue);

export default router;