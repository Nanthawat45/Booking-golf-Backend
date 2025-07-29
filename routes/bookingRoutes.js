import express from 'express';
import {
    bookSlot,
    getBookings,
    updateBooking,
    deleteBooking,
    // startRound, 
    // endRound,
    // cancelBeforeStart, 
    // cancelDuringRound,
    markCaddyAsAvailable,

} from '../controllers/bookingController.js';

import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes สำหรับผู้ใช้ทั่วไป (User) หรือ Admin/Staff
router.post("/book", protect, bookSlot); // จอง Slot
router.get("/", protect, authorizeRoles('admin'), getBookings); // ดูรายการจองทั้งหมด (Admin/Staff เท่านั้น)
router.put("/:id", protect, authorizeRoles('admin'), updateBooking); // อัปเดตการจอง (Admin/Staff เท่านั้น)
router.delete("/:id", protect, authorizeRoles('admin'), deleteBooking); // ลบการจอง (Admin/Staff เท่านั้น)

// Routes สำหรับ Caddy โดยเฉพาะ
// router.put("/caddy/:bookingId/start-round", protect, authorizeRoles('caddy'), startRound); // แคดดี้เริ่มงาน
// router.put("/caddy/:bookingId/end-round", protect, authorizeRoles('caddy'), endRound); // แคดดี้จบงาน
// router.put("/caddy/:bookingId/cancel-before-start", protect, authorizeRoles('caddy'), cancelBeforeStart); // แคดดี้ยกเลิกงานก่อนเริ่ม
// router.put("/caddy/:bookingId/cancel-during-round", protect, authorizeRoles('caddy'), cancelDuringRound); // แคดดี้ยกเลิกงานระหว่างทำ
// router.put("/caddy/mark-available/:bookingId", protect, authorizeRoles('caddy'), markCaddyAsAvailable); // แคดดี้แจ้งทำความสะอาดเสร็จสิ้น

export default router;