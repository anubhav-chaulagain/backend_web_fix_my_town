import { Router } from "express";
// import admin controller
import { AdminUserController } from "../../controllers/admin/user.controller";
import { authorizedMiddleware, adminOnlyMiddleware } from "../../middlewares/authorized.middleware";

let adminUserController = new AdminUserController();

const router = Router();

router.use(authorizedMiddleware); // apply all with middleware
router.use(adminOnlyMiddleware); // apply all with middleware

// router.post("/", uploads.single("image"), adminUserController.createUser);
router.get("/", adminUserController.getAllUsers);
// router.put("/:id", uploads.single("image"), adminUserController.updateUser);
// router.delete("/:id", adminUserController.deleteUser);
// router.get("/:id", adminUserController.getUserById);
// define admin user routes

export default router;