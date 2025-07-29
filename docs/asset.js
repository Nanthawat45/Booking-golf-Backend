/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: การจัดการสินทรัพย์ (รถกอล์ฟ, ถุงกอล์ฟ)
 */

/**
 * @swagger
 * /assets/create:
 *   post:
 *     summary: เพิ่มสินทรัพย์ใหม่ (รถกอล์ฟ/ถุงกอล์ฟ)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - assetId
 *               - type 
 *             properties:
 *               name:
 *                 type: string
 *                 example: "GolfCart"
 *               assetId:
 *                 type: string
 *                 example: "GC001"
 *               type:
 *                 type: string
 *                 enum: [golfCart, golfBags]
 *                 example: "golfCart"
 *     responses:
 *       201:
 *         description: สร้างสินทรัพย์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต (Unauthorized)
 *       403:
 *         description: ไม่มีสิทธิ์ (Forbidden)
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */


/**
 * @swagger
 * /assets/all:
 *   get:
 *     summary: ดึงข้อมูลสินทรัพย์ทั้งหมด
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetType
 *         schema:
 *           type: string
 *           enum: [golf_cart, golf_bag]
 *         description: กรองตามประเภทสินทรัพย์
 *         example: golf_cart
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, unavailable, maintenance, assigned]
 *         description: กรองตามสถานะของสินทรัพย์
 *         example: available
 *     responses:
 *       200:
 *         description: รายการสินทรัพย์ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       403:
 *         description: ไม่มีสิทธิ์
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

// /**
//  * @swagger
//  * /assets/{id}:
//  *   get:
//  *     summary: ดึงข้อมูลสินทรัพย์ตาม ID
//  *     tags: [Assets]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID ของสินทรัพย์
//  *     responses:
//  *       200:
//  *         description: ข้อมูลสินทรัพย์
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 data:
//  *                   $ref: '#/components/schemas/Asset'
//  *       404:
//  *         description: ไม่พบสินทรัพย์
//  *       401:
//  *         description: ไม่ได้รับอนุญาต
//  *       403:
//  *         description: ไม่มีสิทธิ์
//  *       500:
//  *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
//  *
//  *   put:
//  *     summary: อัปเดตข้อมูลสินทรัพย์ตาม ID
//  *     tags: [Assets]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID ของสินทรัพย์
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               assetType:
//  *                 type: string
//  *                 enum: [golf_cart, golf_bag]
//  *                 example: golf_cart
//  *               assetId:
//  *                 type: string
//  *                 example: GC-007
//  *               status:
//  *                 type: string
//  *                 enum: [available, unavailable, maintenance, assigned]
//  *                 example: maintenance
//  *               location:
//  *                 type: string
//  *                 example: Repair Shop
//  *               description:
//  *                 type: string
//  *                 example: Updated description
//  *     responses:
//  *       200:
//  *         description: อัปเดตสินทรัพย์สำเร็จ
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 data:
//  *                   $ref: '#/components/schemas/Asset'
//  *       404:
//  *         description: ไม่พบสินทรัพย์
//  *       401:
//  *         description: ไม่ได้รับอนุญาต
//  *       403:
//  *         description: ไม่มีสิทธิ์
//  *       500:
//  *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
//  *
//  *   delete:
//  *     summary: ลบสินทรัพย์ตาม ID
//  *     tags: [Assets]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID ของสินทรัพย์ที่ต้องการลบ
//  *     responses:
//  *       200:
//  *         description: ลบสินทรัพย์สำเร็จ
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Asset deleted successfully."
//  *       404:
//  *         description: ไม่พบสินทรัพย์
//  *       401:
//  *         description: ไม่ได้รับอนุญาต
//  *       403:
//  *         description: ไม่มีสิทธิ์
//  *       500:
//  *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
//  */

// /**
//  * @swagger
//  * /assets/{id}/status/{newStatus}:
//  *   put:
//  *     summary: อัปเดตสถานะของสินทรัพย์
//  *     tags: [Assets]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID ของสินทรัพย์
//  *       - in: path
//  *         name: newStatus
//  *         required: true
//  *         schema:
//  *           type: string
//  *           enum: [available, unavailable, maintenance, assigned]
//  *         description: สถานะใหม่
//  *     responses:
//  *       200:
//  *         description: อัปเดตสถานะสำเร็จ
//  *       400:
//  *         description: คำขอไม่ถูกต้อง
//  *       401:
//  *         description: ไม่ได้รับอนุญาต
//  *       403:
//  *         description: ไม่มีสิทธิ์
//  *       500:
//  *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
//  */

/**
 * @swagger
 * /assets/status/overall:
 *   get:
 *     summary: ดูสรุปสถานะของสินทรัพย์ทั้งหมด
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สรุปสถานะสำเร็จ
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
 *     Asset:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         assetType:
 *           type: string
 *           enum: [golf_cart, golf_bag]
 *         assetId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [available, unavailable, maintenance, assigned]
 *         location:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */