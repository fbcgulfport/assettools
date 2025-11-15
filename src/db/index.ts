import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import * as schema from "./schema"

const sqlite = new Database("assettools.db")
export const db = drizzle(sqlite, { schema })

try {
	migrate(db, { migrationsFolder: "./drizzle" })
} catch (error) {
	console.error("Migration error:", error)
}

export * from "./schema"
