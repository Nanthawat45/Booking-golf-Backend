/**
 * @swagger
 * tags:
 *   name: Booking
 *   description: จัดการการจองกอล์ฟ
 */

/**
 * @swagger
 * /bookings/book:
 *   post:
 *     summary: สร้างการจองใหม่
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูลการจอง
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseType
 *               - date
 *               - timeSlot
 *               - players
 *               - groupName
 *               - caddy
 *               - totalPrice
 *             properties:
 *               courseType:
 *                 type: string
 *                 enum: ["9", "18"]
 *                 example: "18"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-01"
 *               timeSlot:
 *                 type: string
 *                 example: "08:00"
 *               players:
 *                 type: integer
 *                 example: 4
 *               groupName:
 *                 type: string
 *                 example: "ทีม A"
 *               caddy:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["caddy01"]
 *               totalPrice:
 *                 type: number
 *                 example: 1500
 *               golfCartQty:
 *                 type: integer
 *                 example: 2
 *               golfBagQty:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: การจองสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: ข้อมูลไม่ถูกต้องหรืออุปกรณ์ไม่เพียงพอ
 */

/**
 * @swagger
 * /bookings/:
 *   get:
 *     summary: ดึงข้อมูลการจองทั้งหมดของผู้ใช้
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการการจอง
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: แก้ไขเวลาการจอง
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: รหัสการจองที่ต้องการแก้ไข
 *         schema:
 *           type: string
 *     requestBody:
 *       description: เวลาที่ต้องการแก้ไข
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeSlot:
 *                 type: string
 *                 example: "08:00"
 *             required:
 *               - timeSlot
 *     responses:
 *       200:
 *         description: แก้ไขเวลาการจองสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: ข้อมูลที่ส่งมาไม่ถูกต้อง หรือ ไม่มี `timeSlot`
 *       404:
 *         description: ไม่พบการจอง
 */


/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: ลบการจอง
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: รหัสการจองที่ต้องการลบ
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *       404:
 *         description: ไม่พบการจอง
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7e2f1234567890abcdef0"
 *         user:
 *           type: string
 *           example: "64a7e2f1234567890abcdef0"
 *         courseType:
 *           type: string
 *           example: "18"
 *         date:
 *           type: string
 *           format: date
 *           example: "2025-07-01"
 *         timeSlot:
 *           type: string
 *           example: "08:00"
 *         players:
 *           type: integer
 *           example: 4
 *         groupName:
 *           type: string
 *           example: "ทีม A"
 *         caddy:
 *           type: array
 *           items:
 *             type: string
 *           example: ["caddy01"]
 *         totalPrice:
 *           type: number
 *           example: 1500
 *         isPaid:
 *           type: boolean
 *           example: false
 *         golfCartQty:
 *           type: integer
 *           example: 2
 *         golfBagQty:
 *           type: integer
 *           example: 2
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-06-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-06-01T12:00:00Z"
 */
