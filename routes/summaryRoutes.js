import express from 'express';
import { getAssetOverallStatus } from '../controllers/assetSummaryController.js';

const router = express.Router();

// Route สำหรับดึงข้อมูลสรุปสถานะของ Golf Cart และ Golf Bag
// GET /api/assets/status/summary
router.get('/assets/status/summary', getAssetOverallStatus);

export default router;