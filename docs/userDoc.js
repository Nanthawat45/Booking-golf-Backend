/**
 * @swagger
 * tags:
 *   name: User
 *   description: การจัดการผู้ใช้งานระบบ
 */

/**
 * @swagger
 * /auth/register:
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
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 example: user01
 *               email:
 *                 type: string
 *                 example: user01@example.com
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
 * /auth/admin/register:
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
 *               - username
 *               - password
 *               - email
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin01
 *               email:
 *                 type: string
 *                 example: admin01@example.com
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
 * /auth/login:
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
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: user01
 *               password:
 *                 type: string
 *                 example: "mypassword"
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
 * /auth/profile:
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
 *                 username:
 *                   type: string
 *                   example: user01
 *                 email:
 *                   type: string
 *                   example: user01@example.com
 *                 role:
 *                   type: string
 *                   example: "user"
 *       401:
 *         description: ไม่ได้รับอนุญาต
 */
