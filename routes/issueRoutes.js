import express from 'express';
import {
    reportHoleClosure,
    markIssueInProgress,
    markIssueResolved,
    reportHoleOpen,
    getHoleStatuses
} from '../controllers/issueController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes (ถ้ามี) ---

// --- Caddy & Starter Issue Reporting ---
// แคดดี้และสตาร์ทเตอร์ใช้แจ้งปิดหลุม
router.post('/report-hole-closure', protect, authorizeRoles('caddy', 'starter', 'admin'), reportHoleClosure);
// แคดดี้และสตาร์ทเตอร์ใช้แจ้งเปิดหลุม (หรือยืนยันการเปิด)
router.put('/report-hole-open', protect, authorizeRoles('caddy', 'starter', 'admin'), reportHoleOpen);

// --- Starter Specific Issue Management ---
// สตาร์ทเตอร์แจ้งว่ากำลังแก้ไขปัญหา (ต้องระบุ issueId)
router.put('/:issueId/mark-in-progress', protect, authorizeRoles('starter', 'admin'), markIssueInProgress);
// สตาร์ทเตอร์แจ้งว่าแก้ไขสำเร็จ (ต้องระบุ issueId)
router.put('/:issueId/mark-resolved', protect, authorizeRoles('starter', 'admin'), markIssueResolved);

// --- View All Hole Statuses (Caddy, Starter, Admin, Staff) ---
// ดึงสถานะของหลุมทั้งหมด
router.get('/hole-status', protect, authorizeRoles('caddy', 'starter', 'admin', 'staff'), getHoleStatuses);


export default router;