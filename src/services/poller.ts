import { and, eq } from "drizzle-orm"
import type { Asset, AssetBotsClient } from "../api/assetbots"
import { getAssetName } from "../api/assetbots"
import {
	activeCheckouts,
	db,
	type NewActiveCheckout,
	type NewProcessedItem,
	processedItems
} from "../db"
import type { EmailService } from "./email"

export class AssetPoller {
	private client: AssetBotsClient
	private emailService: EmailService
	private isRunning = false
	private isFirstRun = true

	constructor(client: AssetBotsClient, emailService: EmailService) {
		this.client = client
		this.emailService = emailService
	}

	private async isProcessed(
		itemType: string,
		itemId: string
	): Promise<boolean> {
		const result = await db
			.select()
			.from(processedItems)
			.where(
				and(
					eq(processedItems.itemType, itemType),
					eq(processedItems.itemId, itemId)
				)
			)
			.limit(1)

		return result.length > 0
	}

	private async markProcessed(item: NewProcessedItem): Promise<void> {
		await db.insert(processedItems).values(item)
	}

	private async storeActiveCheckout(
		checkout: NewActiveCheckout
	): Promise<void> {
		// Check if already exists
		const existing = await db
			.select()
			.from(activeCheckouts)
			.where(
				and(
					eq(activeCheckouts.assetId, checkout.assetId),
					eq(activeCheckouts.checkoutId, checkout.checkoutId)
				)
			)
			.limit(1)

		if (existing.length === 0) {
			await db.insert(activeCheckouts).values(checkout)
		}
	}

	private async getActiveCheckout(assetId: string) {
		const result = await db
			.select()
			.from(activeCheckouts)
			.where(
				and(
					eq(activeCheckouts.assetId, assetId),
					eq(activeCheckouts.status, "active")
				)
			)
			.limit(1)

		return result[0]
	}

	private async markCheckoutCompleted(checkoutId: string): Promise<void> {
		await db
			.update(activeCheckouts)
			.set({
				status: "completed",
				completedAt: new Date()
			})
			.where(eq(activeCheckouts.checkoutId, checkoutId))
	}

	private async processCheckout(
		asset: Asset,
		autoSend: boolean
	): Promise<void> {
		if (!asset.checkout) return

		const checkout = asset.checkout
		const checkoutId = checkout.id
		const checkoutValue = checkout.value

		const assetName = getAssetName(asset)
		const checkoutDate = new Date(checkoutValue.date)

		// Always store active checkout for check-in tracking (before processing check)
		await this.storeActiveCheckout({
			assetId: asset.id,
			checkoutId,
			checkoutDate,
			status: "active"
		})

		// Check if already processed for email purposes
		if (await this.isProcessed("checkout", checkoutId)) {
			return
		}

		// Check if checkout is late (only if there's a due date and it's in the past)
		let isLate = false
		let hoursLate = 0

		if (checkoutValue.dueDate) {
			const dueDate = new Date(checkoutValue.dueDate)
			const now = new Date()
			if (now > dueDate) {
				isLate = true
				hoursLate = Math.round(
					(now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)
				)
			}
		}

		// Check if this is a location-only checkout (no person)
		const hasPerson = !!checkoutValue.person
		const personName = checkoutValue.person?.value.name || "Unknown"

		// Extract category from asset
		const category = asset.category?.value

		// TODO: Extract returnTo from custom fields when structure is known
		const returnTo = undefined

		if (isLate) {
			if (autoSend) {
				console.log(`✉️  Late notification: ${assetName}`)
				// Send late notification to admins only (always admin-only for late notifications)
				await this.emailService.sendLateNotification({
					itemType: "checkout",
					assetName,
					personName,
					personEmail: undefined, // API doesn't provide email on person
					date: checkoutValue.date,
					hoursLate,
					category,
					returnTo,
					itemId: checkoutId,
					itemData: {
						assetName,
						personName,
						personEmail: undefined,
						checkoutDate: checkoutValue.date,
						dueDate: checkoutValue.dueDate,
						category,
						returnTo
					}
				})
			} else {
				console.log(`⊘ Skipped late notification: ${assetName} (>1hr old)`)
				// Log skipped email
				const subject = `[LATE] Checkout: ${assetName}`
				for (const adminEmail of [
					...new Set(
						[
							...(process.env.ADMIN_EMAILS?.split(",") || []),
							process.env.FROM_EMAIL || ""
						].filter(Boolean)
					)
				]) {
					await this.emailService.logSkippedEmail(
						adminEmail,
						subject,
						{
							itemType: "checkout",
							itemId: checkoutId,
							isAdmin: true,
							isLate: true,
							needsManualSend: true,
							data: {
								assetName,
								personName,
								personEmail: undefined,
								checkoutDate: checkoutValue.date,
								dueDate: checkoutValue.dueDate,
								category,
								returnTo
							}
						},
						"Checkout older than 1 hour"
					)
				}
			}
		} else {
			// Only send checkout confirmation if there's a person
			// Location-only checkouts don't need confirmation emails
			if (hasPerson) {
				if (autoSend) {
					console.log(`✉️  Checkout confirmation: ${assetName}`)
					// Send normal confirmation
					await this.emailService.sendCheckoutConfirmation({
						assetName,
						personName,
						personEmail: undefined, // API doesn't provide email on person
						checkoutDate: checkoutValue.date,
						dueDate: checkoutValue.dueDate,
						category,
						returnTo,
						itemId: checkoutId,
						checkoutData: {
							assetName,
							personName,
							personEmail: undefined,
							checkoutDate: checkoutValue.date,
							dueDate: checkoutValue.dueDate,
							category,
							returnTo
						}
					})
				} else {
					console.log(
						`⊘ Skipped checkout confirmation: ${assetName} (>1hr old)`
					)
					// Log skipped email
					const subject = `Checkout Confirmation: ${assetName}`
					const recipient = undefined // API doesn't provide email
					const adminRecipient =
						process.env.ADMIN_EMAILS?.split(",")[0] ||
						process.env.FROM_EMAIL ||
						"admin@unknown.com"

					await this.emailService.logSkippedEmail(
						recipient || adminRecipient,
						subject,
						{
							itemType: "checkout",
							itemId: checkoutId,
							isAdmin: !recipient,
							isLate: false,
							needsManualSend: true,
							data: {
								assetName,
								personName,
								personEmail: undefined,
								checkoutDate: checkoutValue.date,
								dueDate: checkoutValue.dueDate,
								category,
								returnTo
							}
						},
						"Checkout older than 1 hour"
					)
				}
			} else {
				console.log(`✓ Checkout stored: ${assetName}`)
			}
		}

		// Mark as processed
		await this.markProcessed({
			itemType: "checkout",
			itemId: checkoutId,
			assetId: asset.id,
			createdAt: checkoutDate,
			processedAt: new Date()
		})
	}

	private async processRepair(asset: Asset): Promise<void> {
		if (!asset.repair) return

		const repair = asset.repair
		const repairId = repair.id
		const repairValue = repair.value

		// Check if already processed
		if (await this.isProcessed("repair", repairId)) {
			return
		}

		const assetName = getAssetName(asset)

		const createdDate = asset.updateDate
			? new Date(asset.updateDate)
			: new Date()

		console.log(`✉️  Repair notification: ${assetName}`)
		// Repairs always go to admins only, no late logic
		await this.emailService.sendRepairNotification({
			assetName,
			status: repairValue.status,
			description: repairValue.description,
			dueDate: repairValue.dueDate,
			repairDate: repairValue.repairDate,
			itemId: repairId,
			repairData: {
				assetName,
				status: repairValue.status,
				description: repairValue.description,
				dueDate: repairValue.dueDate,
				repairDate: repairValue.repairDate
			}
		})

		// Mark as processed
		await this.markProcessed({
			itemType: "repair",
			itemId: repairId,
			assetId: asset.id,
			createdAt: createdDate,
			processedAt: new Date()
		})
	}

	private async processCheckIn(asset: Asset): Promise<void> {
		const assetName = getAssetName(asset)

		// Get active checkout for this asset
		const activeCheckout = await this.getActiveCheckout(asset.id)

		if (!activeCheckout) {
			return // No active checkout to check in
		}

		// Check if already processed as a check-in
		const checkinId = `checkin_${activeCheckout.checkoutId}`
		if (await this.isProcessed("checkin", checkinId)) {
			return
		}

		console.log(
			`Detected check-in for ${assetName}, fetching checkout details...`
		)

		try {
			// Fetch the checkout details from API
			const checkoutDetails = await this.client.getCheckout(
				activeCheckout.checkoutId
			)

			console.log(
				`Checkout details for ${assetName}:`,
				JSON.stringify(checkoutDetails, null, 2)
			)

			if (!checkoutDetails) {
				console.log(`Checkout ${activeCheckout.checkoutId} not found in API`)
				return
			}

			// If status is not "CheckedOut", it means it's been checked in
			if (checkoutDetails.status !== "CheckedOut") {
				console.log(`Processing check-in for ${assetName}`)

				const checkoutDate = new Date(activeCheckout.checkoutDate)
				const checkInDate = new Date()
				const daysOut = Math.round(
					(checkInDate.getTime() - checkoutDate.getTime()) /
						(1000 * 60 * 60 * 24)
				)

				const personName = checkoutDetails.person?.value.name || "Unknown"
				const category = asset.category?.value

				console.log(`✉️  Check-in notification: ${assetName}`)
				// Send check-in notification to admins
				await this.emailService.sendCheckInNotification({
					assetName,
					personName,
					checkoutDate: activeCheckout.checkoutDate.toISOString(),
					checkInDate: checkInDate.toISOString(),
					category,
					daysOut,
					itemId: checkinId,
					checkInData: {
						assetName,
						personName,
						checkoutDate: activeCheckout.checkoutDate.toISOString(),
						checkInDate: checkInDate.toISOString(),
						category,
						daysOut
					}
				})

				// Mark checkout as completed
				await this.markCheckoutCompleted(activeCheckout.checkoutId)

				// Mark check-in as processed
				await this.markProcessed({
					itemType: "checkin",
					itemId: checkinId,
					assetId: asset.id,
					createdAt: checkInDate,
					processedAt: new Date()
				})
			}
		} catch (error) {
			console.error(`Error fetching checkout details for ${assetName}:`, error)
		}
	}

	async poll(): Promise<void> {
		if (this.isRunning) {
			console.log("Poll already running, skipping...")
			return
		}

		this.isRunning = true

		try {
			const assets = await this.client.getAllAssets()

			console.log(`\n=== Poll Run: Found ${assets.length} total assets ===`)

			const now = new Date()
			const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

			for (const asset of assets) {
				const assetName = getAssetName(asset)

				try {
					// Process checkout if exists
					if (asset.checkout) {
						const checkoutDate = new Date(asset.checkout.value.date)
						// Auto-send only if checkout is within the past hour
						const autoSend = checkoutDate >= oneHourAgo
						await this.processCheckout(asset, autoSend)
					} else {
						// Check if this is a check-in (no checkout but we have an active record)
						await this.processCheckIn(asset)
					}

					// Process repair if exists
					if (asset.repair) {
						await this.processRepair(asset)
					}
				} catch (error) {
					console.error(`Error processing asset ${assetName}:`, error)
					// Continue processing other assets
				}
			}

			console.log("\n=== Poll Complete ===\n")

			// Mark first run as complete
			if (this.isFirstRun) {
				this.isFirstRun = false
			}
		} catch (error) {
			console.error("Error during poll:", error)
		} finally {
			this.isRunning = false
		}
	}

	start(intervalMinutes: number): void {
		console.log(`Starting poller with ${intervalMinutes} minute interval`)

		// Run immediately
		this.poll()

		// Then run on interval
		setInterval(
			() => {
				this.poll()
			},
			intervalMinutes * 60 * 1000
		)
	}
}
