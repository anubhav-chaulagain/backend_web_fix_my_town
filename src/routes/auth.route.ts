import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

let authController = new AuthController();
const router = Router();

router.get("/report-stats", authController.getUserReportStats);

router.post("/register", authController.register);
router.post("/login", authController.login);

router.post(
    '/request-password-reset',
    authController.requestPasswordReset
)
router.post("/reset-password/:token", authController.resetPassword);
export default router;

