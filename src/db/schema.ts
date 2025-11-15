import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
})

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => user.id)
})

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", {
		mode: "timestamp"
	}),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
		mode: "timestamp"
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
})

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
})

export const processedItems = sqliteTable("processed_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	itemType: text("item_type").notNull(), // 'checkout', 'reservation', 'repair'
	itemId: text("item_id").notNull(),
	assetId: text("asset_id"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	processedAt: integer("processed_at", { mode: "timestamp" }).notNull()
})

// Email history for the UI
export const emailHistory = sqliteTable("email_history", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	itemType: text("item_type").notNull(),
	itemId: text("item_id").notNull(),
	recipient: text("recipient").notNull(),
	subject: text("subject").notNull(),
	sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
	status: text("status").notNull(), // 'sent', 'failed', 'skipped'
	errorMessage: text("error_message"),
	isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
	isLate: integer("is_late", { mode: "boolean" }).notNull().default(false),
	needsManualSend: integer("needs_manual_send", { mode: "boolean" })
		.notNull()
		.default(false),
	data: text("data", { mode: "json" }) // Store the full item data for resending
})

// Track active checkouts to detect check-ins
export const activeCheckouts = sqliteTable("active_checkouts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	assetId: text("asset_id").notNull(),
	checkoutId: text("checkout_id").notNull(),
	checkoutDate: integer("checkout_date", { mode: "timestamp" }).notNull(),
	status: text("status").notNull(), // 'active', 'completed'
	completedAt: integer("completed_at", { mode: "timestamp" })
})

export type User = typeof user.$inferSelect
export type ProcessedItem = typeof processedItems.$inferSelect
export type NewProcessedItem = typeof processedItems.$inferInsert
export type EmailHistory = typeof emailHistory.$inferSelect
export type NewEmailHistory = typeof emailHistory.$inferInsert
export type ActiveCheckout = typeof activeCheckouts.$inferSelect
export type NewActiveCheckout = typeof activeCheckouts.$inferInsert
