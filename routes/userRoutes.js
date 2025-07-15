import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    registerByAdmin,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateCaddyStatus,
    logoutUser, // Import logoutUser
    markCaddyAsAvailable, // ✅ Import ฟังก์ชันใหม่
    getMyAssignedBookings // ✅ Import ฟังก์ชันใหม่
} from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes (ไม่จำเป็นต้อง Login)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); // เพิ่มเส้นทางสำหรับ logout

router.get("/profile", protect, getUserProfile);
// User-specific Routes (ต้อง Login)
router.put("/update", protect, updateUser); 
router.delete("/delete", protect, deleteUser);

// Admin/Staff Routes (ต้อง Login และมีสิทธิ์ Admin/Staff)
router.post("/admin/register", protect, authorizeRoles('admin'), registerByAdmin); // Admin สร้างบัญชี
router.get("/all", protect, authorizeRoles('admin'), getAllUsers); // ดูผู้ใช้ทั้งหมด
router.get("/:id", protect, authorizeRoles('admin'), getUserById); // ดูผู้ใช้ด้วย ID
router.put("/:id", protect, authorizeRoles('admin'), updateUser); // อัปเดตข้อมูลผู้ใช้ (โดย Admin)
router.delete("/:id", protect, authorizeRoles('admin'), deleteUser); // ลบผู้ใช้ (โดย Admin)

// Caddy-specific Routes (ต้อง Login และมีสิทธิ์ Caddy)
router.get("/caddy/my-assignments", protect, authorizeRoles('caddy'), getMyAssignedBookings); // ✅ แคดดี้ดูงานที่ถูกมอบหมาย
router.put("/caddy/mark-available", protect, authorizeRoles('caddy'), markCaddyAsAvailable); // ✅ แคดดี้แจ้งทำความสะอาดเสร็จสิ้น

// Caddy Status Management (สำหรับ Admin หรือ Starter เท่านั้น)
router.put('/:id/caddy-status/:newStatus', protect, authorizeRoles('admin', 'starter'), updateCaddyStatus);

export default router;