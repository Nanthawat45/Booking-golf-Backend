import express from "express";
import { registerUser, loginUser, getUserProfile, registerByAdmin} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/admin/register", registerByAdmin);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

export default router;
