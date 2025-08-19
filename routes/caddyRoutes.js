import express from 'express';
import {
    startRound, 
    endRound,
    cancelBeforeStart, 
    cancelDuringRound,
    markCaddyAsAvailable,
    getMyAssignedBookings,
    getMyAssignedBookings2
} from '../controllers/bookingController.js';

import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes สำหรับ Caddy โดยเฉพาะ
router.put("/:bookingId/start-round", protect, authorizeRoles('caddy'), startRound); // แคดดี้เริ่มงาน
router.put("/:bookingId/end-round", protect, authorizeRoles('caddy'), endRound); // แคดดี้จบงาน
router.put("/:bookingId/cancel-before-start", protect, authorizeRoles('caddy'), cancelBeforeStart); // แคดดี้ยกเลิกงานก่อนเริ่ม
router.put("/:bookingId/cancel-during-round", protect, authorizeRoles('caddy'), cancelDuringRound); // แคดดี้ยกเลิกงานระหว่างทำ
router.put("/mark-available/:bookingId", protect, authorizeRoles('caddy'), markCaddyAsAvailable); // แคดดี้แจ้งทำความสะอาดเสร็จสิ้น
router.get("/my-assignments", protect, authorizeRoles('caddy'), getMyAssignedBookings);
router.get("/my-assignments2", protect, authorizeRoles('caddy'), getMyAssignedBookings2);

export default router;