/**
 * @swagger
 * tags:
 *   - name: Booking
 *     description: จัดการการจองกอล์ฟ
 */

/* ---------- สร้างการจอง ---------- */
 /**
  * @swagger
  * /bookings/book:
  *   post:
  *     summary: สร้างการจองใหม่
  *     tags: [Booking]
  *     security:
  *       - bearerAuth: []
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schemas/BookingRequest'
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

/* ---------- ดูการจองทั้งหมดของผู้ใช้ ---------- */
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

/* ---------- แก้ไข / ลบการจอง ---------- */
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
  *         schema:
  *           type: string
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               timeSlot:
  *                 type: string
  *             required: [timeSlot]
  *     responses:
  *       200:
  *         description: แก้ไขสำเร็จ
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schemas/Booking'
  *       400:
  *         description: ข้อมูลไม่ถูกต้อง
  *       404:
  *         description: ไม่พบการจอง
  *
  *   delete:
  *     summary: ลบการจอง
  *     tags: [Booking]
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: ลบสำเร็จ
  *       404:
  *         description: ไม่พบการจอง
  */

/* ---------- Schemas ---------- */
 /**
  * @swagger
  * components:
  *   schemas:
  *     BookingRequest:
  *       type: object
  *       required: [courseType, date, timeSlot, players, groupName, caddy, totalPrice]
  *       properties:
  *         courseType: { type: string, enum: ["9","18"], example: "18" }
  *         date:       { type: string, format: date, example: "2025-07-01" }
  *         timeSlot:   { type: string, example: "08:00" }
  *         players:    { type: integer, example: 4 }
  *         groupName:  { type: string, example: "ทีม A" }
  *         caddy:
  *           type: array
  *           items: { type: string }
  *           example: ["caddy01"]
  *         totalPrice: { type: number, example: 1500 }
  *         golfCartQty: { type: integer, example: 2 }
  *         golfBagQty:  { type: integer, example: 2 }
  *
  *     Booking:
  *       allOf:
  *         - $ref: '#/components/schemas/BookingRequest'
  *         - type: object
  *           properties:
  *             _id:       { type: string, example: "64a7e2f1234567890abcdef0" }
  *             user:      { type: string }
  *             isPaid:    { type: boolean, example: false }
  *             createdAt: { type: string, format: date-time }
  *             updatedAt: { type: string, format: date-time }
  */
