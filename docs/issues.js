/**
 * @swagger
 * tags:
 *   - name: Issues
 *     description: การจัดการปัญหาและสถานะหลุมกอล์ฟ
 */

/**
 * @swagger
 * /issues/report-hole-closure:
 *   post:
 *     summary: แคดดี้/สตาร์ทเตอร์ แจ้งปัญหาปิดหลุม
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holeNumber
 *               - description
 *             properties:
 *               holeNumber:
 *                 type: number
 *                 description: หมายเลขหลุมที่ต้องการแจ้งปิด (1-18)
 *                 example: 5
 *               description:
 *                 type: string
 *                 description: รายละเอียดเหตุผลที่แจ้งปิดหลุม
 *                 example: "มีน้ำท่วมขังบริเวณแฟร์เวย์เยอะมาก"
 *     responses:
 *       201:
 *         description: รายงานปัญหาปิดหลุมสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Issue'
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง หรือหมายเลขหลุมไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต (Unauthorized)
 *       403:
 *         description: ไม่มีสิทธิ์ (Forbidden)
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * /issues/{issueId}/mark-in-progress:
 *   put:
 *     summary: สตาร์ทเตอร์แจ้งกำลังดำเนินการแก้ไขปัญหาหลุม
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของปัญหาที่ต้องการแจ้งกำลังแก้ไข
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personInCharge
 *             properties:
 *               personInCharge:
 *                 type: string
 *                 description: ชื่อผู้ที่รับผิดชอบในการแก้ไขปัญหานี้
 *                 example: "ช่างสมศักดิ์"
 *     responses:
 *       200:
 *         description: ปัญหาถูกทำเครื่องหมายว่ากำลังดำเนินการแก้ไขแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Issue'
 *       400:
 *         description: คำขอไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       403:
 *         description: ไม่มีสิทธิ์
 *       404:
 *         description: ไม่พบปัญหา
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * /issues/{issueId}/mark-resolved:
 *   put:
 *     summary: สตาร์ทเตอร์แจ้งแก้ไขปัญหาหลุมสำเร็จ (และเปิดหลุม)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของปัญหาที่ต้องการแจ้งว่าแก้ไขสำเร็จ
 *     responses:
 *       200:
 *         description: ปัญหาถูกทำเครื่องหมายว่าแก้ไขสำเร็จแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Issue'
 *       400:
 *         description: คำขอไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       403:
 *         description: ไม่มีสิทธิ์
 *       404:
 *         description: ไม่พบปัญหา
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * /issues/report-hole-open:
 *   put:
 *     summary: แคดดี้/สตาร์ทเตอร์ แจ้งเปิดหลุม (หรือยืนยันการเปิด)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holeNumber
 *             properties:
 *               holeNumber:
 *                 type: number
 *                 description: หมายเลขหลุมที่ต้องการแจ้งเปิด (1-18)
 *                 example: 5
 *     responses:
 *       200:
 *         description: หลุมถูกทำเครื่องหมายว่าเปิดแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Hole 5 has been marked as open."
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       403:
 *         description: ไม่มีสิทธิ์
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * /issues/hole-status:
 *   get:
 *     summary: ดูสถานะปัจจุบันของหลุมกอล์ฟทั้งหมด
 *     tags: [Issues]
 *     description: แคดดี้ สตาร์ทเตอร์ แอดมิน และสตาฟ สามารถดูภาพรวมสถานะของทั้ง 18 หลุม เพื่อดูว่าหลุมไหนมีปัญหาหรือปิดอยู่
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสถานะหลุมทั้งหมดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Current status of all golf holes retrieved successfully."
 *                 holeStatuses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       holeNumber:
 *                         type: number
 *                         example: 1
 *                       currentStatus:
 *                         type: string
 *                         enum: [open, closed, under_maintenance]
 *                         example: "open"
 *                       activeIssue:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           issueId:
 *                             type: string
 *                             example: "6695b12d3c5e7f001f2a3b4d"
 *                           issueType:
 *                             type: string
 *                             example: "hole_closure_report"
 *                           description:
 *                             type: string
 *                             example: "มีน้ำท่วมขังเยอะมากในแฟร์เวย์หลุม 5"
 *                           reportedBy:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60c8b2c4d6c7e3001f1b2a35"
 *                               name:
 *                                 type: string
 *                                 example: "Caddy John"
 *                           reportedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-07-15T10:00:00.000Z"
 *                           status:
 *                             type: string
 *                             example: "reported"
 *                           personInCharge:
 *                             type: string
 *                             nullable: true
 *                             example: "ช่างสมศักดิ์"
 *                       lastResolvedIssue:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           issueType:
 *                             type: string
 *                             example: "hole_fix_resolved"
 *                           description:
 *                             type: string
 *                             example: "ดูดน้ำเสร็จแล้ว พื้นที่แห้งดี"
 *                           reportedBy:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60c8b2c4d6c7e3001f1b2a36"
 *                               name:
 *                                 type: string
 *                                 example: "Starter Tom"
 *                           reportedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-07-15T11:00:00.000Z"
 *                           status:
 *                             type: string
 *                             example: "resolved"
 *                           resolvedBy:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60c8b2c4d6c7e3001f1b2a36"
 *                               name:
 *                                 type: string
 *                                 example: "Starter Tom"
 *                           resolvedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-07-15T11:45:00.000Z"
 *                           personInCharge:
 *                             type: string
 *                             nullable: true
 *                             example: "ช่างสมศักดิ์"
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       403:
 *         description: ไม่มีสิทธิ์
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Issue:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6695b12d3c5e7f001f2a3b4c"
 *         holeNumber:
 *           type: number
 *           example: 5
 *         issueType:
 *           type: string
 *           enum: [hole_closure_report, hole_fix_progress, hole_fix_resolved, hole_open_report]
 *           example: "hole_closure_report"
 *         description:
 *           type: string
 *           example: "มีน้ำท่วมขังเยอะมากในแฟร์เวย์หลุม 5"
 *         status:
 *           type: string
 *           enum: [reported, in_progress, resolved, closed]
 *           example: "reported"
 *         reportedBy:
 *           type: string
 *           example: "60c8b2c4d6c7e3001f1b2a35"
 *         reportedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-15T10:00:00.000Z"
 *         resolvedBy:
 *           type: string
 *           nullable: true
 *           example: "60c8b2c4d6c7e3001f1b2a36"
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-07-15T11:45:00.000Z"
 *         personInCharge:
 *           type: string
 *           nullable: true
 *           example: "ช่างสมศักดิ์"
 *         quantity:
 *           type: number
 *           nullable: true
 *           example: 2
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-15T09:55:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-15T10:30:00.000Z"
 */