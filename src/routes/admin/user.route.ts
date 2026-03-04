import { Router } from "express";
// import admin controller
import { AdminUserController } from "../../controllers/admin/user.controller";
import { authorizedMiddleware, adminMiddleware } from "../../middlewares/authorized.middleware";
import { uploads } from "../../middlewares/upload.middleware";

let adminUserController = new AdminUserController();

const router = Router();

router.use(authorizedMiddleware); // apply all with middleware
router.use(adminMiddleware); // apply all with middleware


router.post("/users", uploads.single("profilePicture"), adminUserController.createUser);
router.get("/users", adminUserController.getAllUsers);
router.get("/stats",      adminUserController.getAdminStats);
router.get("/authorities", adminUserController.getAuthorityUsers);
router.put("/users/:id", uploads.single("profilePicture"), adminUserController.updateUser);
router.delete("/users/:id", adminUserController.deleteUser);
router.get("/users/:id", adminUserController.getUserById);
// define admin user routes

export default router;