import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Track processed items to avoid duplicate emails
export const processedItems = sqliteTable('processed_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemType: text('item_type').notNull(), // 'checkout', 'reservation', 'repair'
  itemId: text('item_id').notNull(),
  assetId: text('asset_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp' }).notNull(),
});

// Email history for the UI
export const emailHistory = sqliteTable('email_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemType: text('item_type').notNull(),
  itemId: text('item_id').notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull(), // 'sent', 'failed', 'skipped'
  errorMessage: text('error_message'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  isLate: integer('is_late', { mode: 'boolean' }).notNull().default(false),
  needsManualSend: integer('needs_manual_send', { mode: 'boolean' }).notNull().default(false),
  data: text('data', { mode: 'json' }), // Store the full item data for resending
});

export type ProcessedItem = typeof processedItems.$inferSelect;
export type NewProcessedItem = typeof processedItems.$inferInsert;
export type EmailHistory = typeof emailHistory.$inferSelect;
export type NewEmailHistory = typeof emailHistory.$inferInsert;
