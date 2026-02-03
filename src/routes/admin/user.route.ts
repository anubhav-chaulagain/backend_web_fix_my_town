import { Router } from "express";
// import admin controller
import { AdminUserController } from "../../controllers/admin/user.controller";
import { authorizedMiddleware, adminMiddleware } from "../../middlewares/authorized.middleware";
import { uploads } from "../../middlewares/upload.middleware";

let adminUserController = new AdminUserController();

const router = Router();

router.use(authorizedMiddleware); // apply all with middleware
router.use(adminMiddleware); // apply all with middleware

router.post("/", uploads.single("profilePicture"), adminUserController.createUser);
router.get("/", adminUserController.getAllUsers);
router.put("/:email", uploads.single("profilePicture"), adminUserController.updateUser);
router.delete("/:id", adminUserController.deleteUser);
router.get("/:id", adminUserController.getUserByEmail);
// define admin user routes

export default router;