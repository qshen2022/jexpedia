<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Monorepo Architecture

Jexpedia is an npm workspaces monorepo with two apps and one shared package:

```
apps/api/    — Hono REST API server (port 3001), owns all data (SQLite + Drizzle)
apps/web/    — Next.js frontend (port 3000), NO database access — calls API via HTTP
packages/shared/ — Shared TypeScript types
```

## Key rules

- **`apps/web/` must NEVER import from `drizzle-orm`, `better-sqlite3`, `bcryptjs`, `uuid`, or any DB module.** All data access goes through `apps/web/src/lib/api-client.ts`.
- **`apps/api/` must NEVER import from `next`, `react`, or any UI module.** It is a pure REST server.
- Server Components in the web app use `createApiClient(token)` for authenticated requests and `api` (the default export) for public ones.
- Client Components use the `useApi()` hook which reads the JWT token from `AuthProvider` context.
- Auth flow: API issues JWTs → NextAuth's `authorize` calls `POST /api/auth/signin` → JWT stored in session as `accessToken` → passed to API client.

## Dev commands

```bash
npm run dev          # starts both API (3001) + web (3000)
npm run dev:api      # API server only
npm run dev:web      # Next.js only
npm run seed         # seed database via API app
```
