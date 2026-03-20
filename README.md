# Urban Civic Ecosystem — Local Development

This repository follows a client-server architecture:

- `client` — Next.js (frontend)
- `server` — NestJS + Prisma (backend)

Below is a step-by-step guide to run local development for **both** parts.

## 1) Prerequisites

- Node.js `>=20`
- npm `>=10`
- PostgreSQL (local or remote)
- `mkcert` (installed globally, used to generate local HTTPS certificates)

## 2) Install dependencies

From the repository root:

```bash
cd client && npm install
cd ../server && npm install
```

## 3) Configure environment variables

### Server

```bash
cd server
cp .env.example .env
```

Fill in values in `server/.env`:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — token secrets
- `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` — token TTL values
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — for Google OAuth
- `TLS_ENABLED`, `TLS_CERT_PATH`, `TLS_KEY_PATH` — HTTPS settings
- `PORT`, `CORS_ORIGIN`, `CLIENT_URL` — network settings

### Client

```bash
cd client
cp .env.example .env
```

Fill in `client/.env`:

- `NEXT_PUBLIC_API_URL` — API base URL (default: `https://localhost:3001`)

## 4) HTTPS certificates for local development

By default, the project expects:

- `certs/cert.pem`
- `certs/key.pem`

Generate certificates with `mkcert`:

```bash
mkdir -p certs
mkcert -install
mkcert -cert-file certs/cert.pem -key-file certs/key.pem localhost 127.0.0.1 ::1
```

## 5) Prepare the database (Prisma)

In the `server` folder:

```bash
npx prisma generate
npx prisma db push
```

## 6) Run in development mode

Open two terminals.

Terminal 1 (backend):

```bash
cd server
npm run start:dev
```

Terminal 2 (frontend, HTTPS):

```bash
cd client
npm run dev:https
```

## 7) Local URLs

- Frontend: `https://localhost:3000`
- Backend API: `https://localhost:3001`
- Swagger: `https://localhost:3001/api`

## 8) Useful commands

### Client

```bash
npm run lint
npm run build
```

### Server

```bash
npm run test
npm run lint
npm run build
```
