# feature-flag-api

Feature flag management and evaluation API.

## Features

- Auth (register/login, JWT)
- Flag CRUD + toggle
- Evaluation APIs (`/evaluate`, `/evaluate/bulk`) with API key
- Audit logs (`/audit`, `/flags/:key/audit`)
- Redis cache + MySQL persistence
- Swagger docs (`/api-docs`)

## Stack

- Node.js + TypeScript
- Express
- Sequelize + MySQL
- Redis (ioredis)
- JWT + bcrypt
- Zod validation

## Run

```bash
npm install
npm run dev
```

Build + start:

```bash
npm run build
npm start
```

Health check:
- `GET /healthz`

Swagger:
- `GET /api-docs`

## Environment Variables

`.env.example` 기준:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=feature_flag
DB_USER=root
DB_PASSWORD=rootpassword

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=86400

API_PREFIX=/api/v1
```

## API (Base: `/api/v1`)

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Flags (JWT)
- `POST /flags`
- `GET /flags`
- `GET /flags/:key`
- `PATCH /flags/:key`
- `POST /flags/:key/toggle`
- `DELETE /flags/:key`
- `GET /flags/:key/audit`

### Evaluate (API key)
- `POST /evaluate`
- `POST /evaluate/bulk`

### Audit (JWT)
- `GET /audit`

## Tests

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
```

## Architecture

```mermaid
flowchart TD
  SDK[Client/SDK] --> E[/api/v1/evaluate]
  Admin[Admin API Client] --> F[/api/v1/flags]
  E --> SVC[Evaluate Service]
  F --> FSVC[Flag Service]
  SVC --> REDIS[(Redis Cache)]
  SVC --> MYSQL[(MySQL)]
  FSVC --> MYSQL
  FSVC --> AUD[Audit Service]
  AUD --> MYSQL
```
