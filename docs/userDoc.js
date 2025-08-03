/**
 * @swagger
 * tags:
 *   name: User
 *   description: การจัดการผู้ใช้งานระบบ
 */

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: สมัครสมาชิกด้วยตัวเอง
 *     tags: [User]
 *     requestBody:
 *       description: ข้อมูลผู้ใช้งานใหม่
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: user01
 *               email:
 *                 type: string
 *                 example: user01@gmail.com
 *               password:
 *                 type: string
 *                 example: "mypassword"
 *     responses:
 *       201:
 *         description: สมัครสมาชิกสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 */

/**
 * @swagger
 * /user/admin/register:
 *   post:
 *     summary: สมัครสมาชิกโดยผู้ดูแลระบบ
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูลผู้ใช้งานใหม่
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: admin01
 *               email:
 *                 type: string
 *                 example: admin01@gmail.com
 *               password:
 *                 type: string
 *                 example: "adminpassword"
 *               role:
 *                 type: string
 *                 example: "admin"
 *     responses:
 *       201:
 *         description: สมัครสมาชิกโดยแอดมินสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต
 */

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [User]
 *     requestBody:
 *       description: ข้อมูลสำหรับเข้าสู่ระบบ
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: u1@gmail.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: ข้อมูลโปรไฟล์ผู้ใช้ที่ล็อกอินแล้ว
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูลโปรไฟล์ผู้ใช้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: user01
 *                 email:
 *                   type: string
 *                   example: user01@gmail.com
 *                 role:
 *                   type: string
 *                   example: "user"
 *       401:
 *         description: ไม่ได้รับอนุญาต
 */

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: ออกจากระบบ
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ออกจากระบบสำเร็จ
 *       401:
 *         description: ต้องเข้าสู่ระบบก่อน
 */

// /**
//  * @swagger
//  * /user/update:
//  *   put:
//  *     summary: อัปเดตข้อมูลผู้ใช้ของตัวเอง
//  *     tags: [User]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: newUsername
//  *               email:
//  *                 type: string
//  *                 example: newemail@gmail.com
//  *     responses:
//  *       200:
//  *         description: อัปเดตสำเร็จ
//  *       401:
//  *         description: ต้องเข้าสู่ระบบ
//  */

/**
 * @swagger
 * /user/delete:
 *   delete:
 *     summary: ลบบัญชีของตัวเอง
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: ลบสำเร็จ
 *       401:
 *         description: ไม่ได้รับอนุญาต
 */

/**
 * @swagger
 * /user/all:
 *   get:
 *     summary: ดูรายชื่อผู้ใช้ทั้งหมด (Admin เท่านั้น)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการผู้ใช้
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *       403:
 *         description: ต้องเป็น admin
 */

/**
 * @swagger
 * /user/available-caddies:
 *   get:
 *     summary: ดูcaddy ที่ว่างทั้งหมด (Admin , User เท่านั้น)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการแคดดี้ที่ว่างอยู่
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *       403:
 *         description: ต้องเป็น admin
 */

// /**
//  * @swagger
//  * /user/{id}:
//  *   get:
//  *     summary: ดูผู้ใช้ตาม ID
//  *     tags: [User]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: ข้อมูลผู้ใช้
//  *       404:
//  *         description: ไม่พบ
//  *   put:
//  *     summary: อัปเดตผู้ใช้ (admin)
//  *     tags: [User]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *               email:
//  *                 type: string
//  *               role:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: อัปเดตแล้ว
//  *       403:
//  *         description: ต้องเป็น admin
//  *   delete:
//  *     summary: ลบผู้ใช้ตาม ID
//  *     tags: [User]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       204:
//  *         description: ลบสำเร็จ
//  *       403:
//  *         description: ต้องเป็น admin
//  */


// /**
//  * @swagger
//  * /user/{id}/caddy-status/{newStatus}:
//  *   put:
//  *     summary: ผู้ดูแลหรือสตาร์ทเตอร์เปลี่ยนสถานะของแคดดี้
//  *     tags: [User]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: รหัสผู้ใช้ (แคดดี้)
//  *       - in: path
//  *         name: newStatus
//  *         required: true
//  *         schema:
//  *           type: string
//  *           enum: [available, inUse, cleaning, spare, broken]
//  *         description: สถานะใหม่ของแคดดี้
//  *     responses:
//  *       200:
//  *         description: เปลี่ยนสถานะสำเร็จ
//  *       400:
//  *         description: สถานะไม่ถูกต้อง
//  *       401:
//  *         description: ต้องเข้าสู่ระบบ
//  *       403:
//  *         description: สิทธิ์ไม่เพียงพอ (ต้องเป็น admin หรือ starter)
//  *       404:
//  *         description: ไม่พบแคดดี้
//  */
