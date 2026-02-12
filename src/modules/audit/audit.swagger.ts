/**
 * @swagger
 * /api/v1/flags/{key}/audit:
 *   get:
 *     tags: [Audit]
 *     summary: Get audit logs for a specific flag
 *     description: Returns the change history of a specific feature flag (newest first)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Flag key (kebab-case)
 *         example: new-checkout-flow
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
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Flag not found
 *
 * /api/v1/audit:
 *   get:
 *     tags: [Audit]
 *     summary: Get all audit logs
 *     description: Returns the change history across all feature flags (newest first)
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
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         action:
 *           type: string
 *           enum: [CREATE, UPDATE, TOGGLE, DELETE]
 *           example: TOGGLE
 *         changedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             name:
 *               type: string
 *               example: 현민
 *         before:
 *           type: object
 *           nullable: true
 *           example: { "enabled": false }
 *         after:
 *           type: object
 *           nullable: true
 *           example: { "enabled": true }
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-02-12T11:00:00.000Z"
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         totalItems:
 *           type: integer
 *           example: 3
 *         totalPages:
 *           type: integer
 *           example: 1
 */