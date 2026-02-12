/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication (register, login)
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@samlab.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: securePass123!
 *               name:
 *                 type: string
 *                 example: HyunMin
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and receive JWT token
 *     tags: [Auth]
 *     requestBody:
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
 *                 example: admin@samlab.com
 *               password:
 *                 type: string
 *                 example: securePass123!
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */