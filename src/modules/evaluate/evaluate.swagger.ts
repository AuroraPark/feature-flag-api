/**
 * @swagger
 * tags:
 *   name: Evaluate
 *   description: Flag evaluation for client SDKs (API Key auth)
 */

/**
 * @swagger
 * /api/v1/evaluate:
 *   post:
 *     summary: Evaluate a single feature flag
 *     tags: [Evaluate]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flagKey
 *               - context
 *             properties:
 *               flagKey:
 *                 type: string
 *                 example: new-checkout-flow
 *               context:
 *                 type: object
 *                 required:
 *                   - userId
 *                 properties:
 *                   userId:
 *                     type: string
 *                     example: user_12345
 *                   attributes:
 *                     type: object
 *                     example: { "plan": "premium", "country": "KR" }
 *     responses:
 *       200:
 *         description: Evaluation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flagKey:
 *                   type: string
 *                 enabled:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                   enum: [BOOLEAN_ON, BOOLEAN_OFF, PERCENTAGE_MATCH, PERCENTAGE_MISS, USER_TARGETED, USER_NOT_TARGETED, FLAG_DISABLED, FLAG_NOT_FOUND]
 *                 evaluatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Invalid or missing API key
 */

/**
 * @swagger
 * /api/v1/evaluate/bulk:
 *   post:
 *     summary: Evaluate multiple feature flags at once
 *     tags: [Evaluate]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flagKeys
 *               - context
 *             properties:
 *               flagKeys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["new-checkout-flow", "dark-mode", "beta-feature"]
 *               context:
 *                 type: object
 *                 required:
 *                   - userId
 *                 properties:
 *                   userId:
 *                     type: string
 *                     example: user_12345
 *                   attributes:
 *                     type: object
 *     responses:
 *       200:
 *         description: Bulk evaluation results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       flagKey:
 *                         type: string
 *                       enabled:
 *                         type: boolean
 *                       reason:
 *                         type: string
 *                 evaluatedAt:
 *                   type: string
 *                   format: date-time
 */