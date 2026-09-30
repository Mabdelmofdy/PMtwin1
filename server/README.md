# @pm-twin/server

Local backend scaffold. Not the active product runtime, and not production-ready.

The active runtime is the `web/` SPA (browser storage and client-side auth). This process is not wired to that SPA. `VITE_USE_SERVER_API` must stay off.

DO NOT ENABLE SERVER API CUTOVER UNTIL COMMAND HANDLER PARITY AND CANONICAL SERVER DATA MODEL ARE COMPLETE.

## What this scaffold does

- Fastify HTTP server
- Prisma client against local PostgreSQL
- `POST /api/v1/auth/login` — bcrypt verification, with a legacy base64 seed-hash fallback; returns an access JWT only
- `GET /api/v1/auth/me` — requires that access JWT
- `GET /api/v1/opportunities` and `GET /api/v1/opportunities/:id` — authenticated reads
- `POST /api/v1/commands` — envelope check, idempotency row, audit row with `action = command.unimplemented`, then HTTP 501 `COMMAND_NOT_IMPLEMENTED`
- `GET /api/v1/health`

Login does not issue a refresh token. `JWT_REFRESH_SECRET` is loaded so local env files stay stable, and it is not used to sign or verify tokens. There is no refresh, logout, MFA, or account-recovery route.

The command gateway does not write Opportunity, Application, PostMatch, Negotiation, Deal, Contract, Notification, User, or Company rows. Idempotency stores `success: false`. Audit action is `command.unimplemented`, not the product command name.

The Prisma schema is a temporary JSON-payload boot schema. It is not the canonical Party / Workspace / Membership model. See the header in `prisma/schema.prisma`.

## Local only

Placeholder credentials in the repo compose file are for a developer machine. Do not point `DATABASE_URL` at a shared or production database. Do not put real secrets in git. Copy `server/.env.example` to `server/.env` (gitignored).

```bash
docker compose up --build
```

That local compose file publishes Postgres on port 5432 and the API on port 3001. The API container runs `prisma migrate deploy` against that local database and, because compose sets `SEED_ON_BOOT=true`, imports POC seed JSON into the local volume.

Health: `GET http://localhost:3001/api/v1/health`

Without Docker, against a local Postgres you already intend to use:

```bash
docker compose up postgres -d
cd server
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

`npm run seed` runs only when `SEED_MODE=local`. It upserts seed JSON. It is not safe to run against a database you cannot replace.
