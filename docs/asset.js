/**
 * @swagger
 * tags:
 *   name: Asset
 *   description: Asset management and status overview
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Asset:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           example: 665fe8d145f93c2bfe0e2d4a
 *         name:
 *           type: string
 *           example: GolfCart-001
 *         type:
 *           type: string
 *           enum: [golfCart, caddy, golfBag]
 *           example: golfCart
 *         status:
 *           type: string
 *           enum: [booked, inUse, charging, available, spare, broken]
 *           example: available
 *         total:
 *           type: integer
 *           example: 40
 *         available:
 *           type: integer
 *           example: 29
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/assets/create:
 *   post:
 *     summary: Create a new asset
 *     tags: [Asset]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Asset'
 *     responses:
 *       201:
 *         description: Asset created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 */

/**
 * @swagger
 * /api/assets/all:
 *   get:
 *     summary: Get all assets
 *     tags: [Asset]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Asset'
 */

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Asset]
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
 *         description: Asset found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *   put:
 *     summary: Update asset by ID
 *     tags: [Asset]
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
 *             $ref: '#/components/schemas/Asset'
 *     responses:
 *       200:
 *         description: Asset updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *   delete:
 *     summary: Delete asset by ID
 *     tags: [Asset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Asset deleted
 */

/**
 * @swagger
 * /api/assets/{id}/status/{newStatus}:
 *   put:
 *     summary: Update status of an asset
 *     tags: [Asset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: newStatus
 *         required: true
 *         schema:
 *           type: string
 *           enum: [booked, inUse, charging, available, spare, broken]
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 */

/**
 * @swagger
 * /api/assets/status/overall:
 *   get:
 *     summary: Get overall status summary grouped by asset type
 *     tags: [Asset]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status summary
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: golfCart
 *                   statusCounts:
 *                     type: object
 *                     additionalProperties:
 *                       type: integer
 *                     example:
 *                       booked: 2
 *                       inUse: 3
 *                       charging: 1
 *                       available: 4
 *                       spare: 0
 *                       broken: 1
 */
