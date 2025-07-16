/**
 * @swagger
 * tags:
 *   - name: Caddy
 *     description: จัดการงานของแคดดี้
 */

/* ---------- Caddy เริ่มรอบ ---------- */
 /**
  * @swagger
  * /bookings/caddy/{bookingId}/start-round:
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
  * /bookings/caddy/{bookingId}/end-round:
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

/* ---------- Caddy ยกเลิกก่อนเริ่ม ---------- */
 /**
  * @swagger
  * /bookings/caddy/{bookingId}/cancel-before-start:
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
  * /bookings/caddy/{bookingId}/cancel-during-round:
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
