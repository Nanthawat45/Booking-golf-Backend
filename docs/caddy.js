/**
 * @swagger
 * tags:
 *   - name: Caddy
 *     description: จัดการงานของแคดดี้
 */

/* ---------- Caddy เริ่มรอบ ---------- */
 /**
  * @swagger
  * /caddy/{bookingId}/start-round:
  *   put:
  *     summary: แคดดี้เริ่มรอบการเล่น
  *     tags: [Caddy]
  *     security: [ { bearerAuth: [] } ]
  *     parameters:
  *       - in: path
  *         name: bookingId
  *         required: true
  *         schema: { type: string }
  *     responses:
  *       200: { description: เริ่มรอบเรียบร้อย }
  *       401: { description: ต้องเข้าสู่ระบบ }
  *       403: { description: สิทธิ์ไม่เพียงพอ }
  *       404: { description: ไม่พบการจอง }
  */

/* ---------- Caddy จบรอบ ---------- */
 /**
  * @swagger
  * /caddy/{bookingId}/end-round:
  *   put:
  *     summary: แคดดี้จบงานรอบการเล่น
  *     tags: [Caddy]
  *     security: [ { bearerAuth: [] } ]
  *     parameters:
  *       - in: path
  *         name: bookingId
  *         required: true
  *         schema: { type: string }
  *     responses:
  *       200: { description: จบรอบเรียบร้อย }
  *       401: { description: ต้องเข้าสู่ระบบ }
  *       403: { description: สิทธิ์ไม่เพียงพอ }
  *       404: { description: ไม่พบการจอง }
  */

/* ---------- Caddy แคดดี้ทำความสอาดเสร็จ ---------- */
/**
 * @swagger
 * /caddy/mark-available/{bookingId}:
 *   put:
 *     summary: แคดดี้แจ้งสถานะว่าว่างหลังจากทำความสะอาดอุปกรณ์
 *     description: ใช้สำหรับแคดดี้ในการปลดตัวเองออกจากสถานะ 'cleaning' และเปลี่ยนอุปกรณ์ที่อยู่ใน booking ให้เป็น 'available'
 *     tags: [Caddy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: bookingId
 *         in: path
 *         required: true
 *         description: รหัสของการจองที่แคดดี้ถูกมอบหมาย
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: อัปเดตสถานะเรียบร้อยแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Caddy 'John Doe' and associated assets are now available.
 *                 caddy:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: caddy
 *                     caddyStatus:
 *                       type: string
 *                       example: available
 *                 bookingIdAcknowledged:
 *                   type: string
 *       400:
 *         description: สถานะของแคดดี้ไม่ใช่ 'cleaning' หรือสถานะของ asset ไม่ถูกต้อง
 *       403:
 *         description: ไม่ใช่แคดดี้ หรือไม่ได้ถูกมอบหมายให้ booking นี้
 *       404:
 *         description: ไม่พบ booking หรือ caddy
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/* ---------- Caddy ยกเลิกก่อนเริ่ม ---------- */
 /**
  * @swagger
  * /caddy/{bookingId}/cancel-before-start:
  *   put:
  *     summary: แคดดี้ยกเลิกงานก่อนเริ่มรอบ
  *     tags: [Caddy]
  *     security: [ { bearerAuth: [] } ]
  *     parameters:
  *       - in: path
  *         name: bookingId
  *         required: true
  *         schema: { type: string }
  *     responses:
  *       200: { description: ยกเลิกก่อนเริ่มเรียบร้อย }
  *       401: { description: ต้องเข้าสู่ระบบ }
  *       403: { description: สิทธิ์ไม่เพียงพอ }
  *       404: { description: ไม่พบการจอง }
  */

/* ---------- Caddy ยกเลิกระหว่างรอบ ---------- */
 /**
  * @swagger
  * /caddy/{bookingId}/cancel-during-round:
  *   put:
  *     summary: แคดดี้ยกเลิกงานระหว่างรอบ
  *     tags: [Caddy]
  *     security: [ { bearerAuth: [] } ]
  *     parameters:
  *       - in: path
  *         name: bookingId
  *         required: true
  *         schema: { type: string }
  *     responses:
  *       200: { description: ยกเลิกระหว่างรอบเรียบร้อย }
  *       401: { description: ต้องเข้าสู่ระบบ }
  *       403: { description: สิทธิ์ไม่เพียงพอ }
  *       404: { description: ไม่พบการจอง }
  */

/* ---------- Caddy แคดดี้ดูรายการจอง ---------- */
/**
 * @swagger
 * /caddy/my-assignments:
 *   get:
 *     summary: แคดดี้ดูรายการจองที่ได้รับมอบหมาย
 *     tags: [Caddy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการที่ได้รับมอบหมาย
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   timeSlot:
 *                     type: string
 *                   groupName:
 *                     type: string
 *                   courseType:
 *                     type: string
 *                   players:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: ต้องเข้าสู่ระบบ
 *       403:
 *         description: สิทธิ์ไม่เพียงพอ (ต้องเป็น caddy)
 */

/* ---------- Caddy แคดดี้ดูรายการจอง2 ---------- */
/**
 * @swagger
 * /caddy/my-assignments2:
 *   get:
 *     summary: แคดดี้ดูรายการจองที่ได้รับมอบหมาย2
 *     tags: [Caddy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการที่ได้รับมอบหมาย
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   timeSlot:
 *                     type: string
 *                   groupName:
 *                     type: string
 *                   courseType:
 *                     type: string
 *                   players:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: ต้องเข้าสู่ระบบ
 *       403:
 *         description: สิทธิ์ไม่เพียงพอ (ต้องเป็น caddy)
 */
