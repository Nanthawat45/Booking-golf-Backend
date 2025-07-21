import express from 'express';
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    updateAssetStatus,
    getAssetOverallStatus
} from '../controllers/assetController.js';

import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Asset Management Routes (สำหรับ Admin เท่านั้น) ---
// ใช้จัดการข้อมูล Asset ทั่วไป เช่น สร้าง, ดึงข้อมูลทั้งหมด, ดึงข้อมูลรายตัว, อัปเดต, ลบ
router.post("/create", protect, authorizeRoles('admin'), createAsset); // สร้าง Asset ใหม่
router.get("/all", protect, authorizeRoles('admin'), getAllAssets);   // ดึง Asset ทั้งหมด
router.get("/:id", protect, authorizeRoles('admin'), getAssetById);    // ดึง Asset ด้วย ID
router.put("/:id", protect, authorizeRoles('admin'), updateAsset);     // อัปเดตข้อมูล Asset
router.delete("/:id", protect, authorizeRoles('admin'), deleteAsset);  // ลบ Asset

// --- Asset Status Management Routes (สำหรับ Admin, Caddy, Starter) ---
// Endpoint นี้ใช้สำหรับอัปเดตสถานะของ Asset (เช่น available, inUse, clean, unavailable)
// Caddy จะใช้ Endpoint นี้ไม่ได้โดยตรงเพื่อเปลี่ยนสถานะ inUse/clean/available เพราะถูกจัดการผ่าน bookingController แล้ว
// แต่ Admin/Starter สามารถใช้เพื่อแก้ไขสถานะด้วยมือได้
router.put('/:id/status/:newStatus', protect, authorizeRoles('admin', 'starter', 'caddy'), updateAssetStatus);

// --- Asset Reporting/Overview Routes (สำหรับ Admin, Staff) ---
// ใช้สำหรับดึงข้อมูลสรุปสถานะโดยรวมของ Asset ทั้งหมด
router.get('/status/overall', protect, authorizeRoles('admin', 'starter', 'caddy'), getAssetOverallStatus);

export default router;