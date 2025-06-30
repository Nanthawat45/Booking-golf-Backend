import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  registerByAdmin,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/register", protect, registerByAdmin);
router.get("/profile", protect, getUserProfile);

export default router;

