import { Router } from "express";
import { IssueController } from "../controllers/issue.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploads } from "../middlewares/upload.middleware";

let issueController = new IssueController();

const router = Router();

router.use(authorizedMiddleware); // apply authentication to all routes

// Public/Citizen routes
router.post("/", uploads.array("issueImages", 5), issueController.createIssue);
router.get("/", issueController.getAllIssues);
router.get("/my-issues", issueController.getUserIssues);
router.get("/my-recent", issueController.getMyRecentIssues); // ADD before /:id
router.get("/:id", issueController.getIssueById);
router.put("/:id", uploads.array("issueImages", 5), issueController.updateIssue);
router.delete("/:id", issueController.deleteIssue);

// Authority routes (for status management)
router.patch("/:id/status", issueController.updateIssueStatus);
router.patch("/:id/assign", issueController.assignIssue);
router.patch("/:id/resolve", issueController.resolveIssue);

export default router;