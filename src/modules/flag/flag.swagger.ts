/**
 * @swagger
 * tags:
 *   name: Flags
 *   description: Feature Flag management
 */

/**
 * @swagger
 * /api/v1/flags:
 *   post:
 *     summary: Create a new feature flag
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - name
 *               - type
 *             properties:
 *               key:
 *                 type: string
 *                 example: new-checkout-flow
 *                 description: Unique identifier (kebab-case)
 *               name:
 *                 type: string
 *                 example: New Checkout Flow
 *               description:
 *                 type: string
 *                 example: A/B test for the new checkout process
 *               type:
 *                 type: string
 *                 enum: [boolean, percentage, user_target]
 *               enabled:
 *                 type: boolean
 *                 default: false
 *               percentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               targetUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Flag created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate flag key
 */

/**
 * @swagger
 * /api/v1/flags:
 *   get:
 *     summary: List all feature flags with pagination
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by key or name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [boolean, percentage, user_target]
 *     responses:
 *       200:
 *         description: Paginated list of flags
 */

/**
 * @swagger
 * /api/v1/flags/{key}:
 *   get:
 *     summary: Get a flag by key
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: new-checkout-flow
 *     responses:
 *       200:
 *         description: Flag details
 *       404:
 *         description: Flag not found
 *   patch:
 *     summary: Update a flag (partial update)
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *               percentage:
 *                 type: integer
 *               targetUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated flag
 *       404:
 *         description: Flag not found
 *   delete:
 *     summary: Soft delete a flag
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Flag deleted
 *       404:
 *         description: Flag not found
 */

/**
 * @swagger
 * /api/v1/flags/{key}/toggle:
 *   post:
 *     summary: Toggle flag enabled status
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Toggled flag status
 *       404:
 *         description: Flag not found
 */