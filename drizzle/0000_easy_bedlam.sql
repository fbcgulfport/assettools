CREATE TABLE `active_checkouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` text NOT NULL,
	`checkout_id` text NOT NULL,
	`checkout_date` integer NOT NULL,
	`status` text NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `email_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`sent_at` integer NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`is_late` integer DEFAULT false NOT NULL,
	`needs_manual_send` integer DEFAULT false NOT NULL,
	`data` text
);
--> statement-breakpoint
CREATE TABLE `processed_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`asset_id` text,
	`created_at` integer NOT NULL,
	`processed_at` integer NOT NULL
);
