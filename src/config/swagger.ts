import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Feature Flag API',
            version: '1.0.0',
            description: 'Feature Flag & Experiment Platform MVP — Portfolio Project for SamLab',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token for management APIs (/flags, /audit)',
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key',
                    description: 'API Key for evaluation APIs (/evaluate)',
                },
            },
        },
    },
    apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.swagger.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);