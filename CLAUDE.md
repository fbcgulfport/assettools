Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv

## Framework

This project uses Next.js App Router with:
- **React**: UI components and pages
- **Next.js API Routes**: API endpoints in `src/app/api`
- **Better-Auth**: Authentication with Google OAuth
- **Drizzle ORM**: Database with SQLite via `better-sqlite3`
- **Tailwind v4**: Styling (CSS-based imports in `src/app/globals.css`)

## APIs

- `better-sqlite3` for SQLite (required for Next.js compatibility)
- Use Next.js API route handlers instead of Express
- Use better-auth for authentication instead of custom OAuth
- Use Drizzle ORM for database queries

## Project Structure

- `src/app/` - Next.js app directory (pages, layouts, API routes)
- `src/lib/` - Shared utilities and clients
- `src/services/` - Business logic (email, polling)
- `src/api/` - External API clients (AssetBots)
- `src/db/` - Database schema and connection
- `src/emails/` - React Email templates
- `src/cron.ts` - Background polling worker

## Development

- Run Next.js dev server: `bun dev`
- Run background polling: `bun cron`
- Generate DB migrations: `bun run db:generate`
- Apply migrations: `bun run db:migrate`
- Type check: `bun run typecheck`
- Lint: `bun run lint`

## Testing

Use `bun test` to run tests.

```ts
import { test, expect } from "bun:test"

test("example", () => {
  expect(1).toBe(1)
})
```

## Frontend

Next.js handles bundling and HMR automatically. Import CSS directly in components or use Tailwind classes.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.
