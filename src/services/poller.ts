import { and, eq } from "drizzle-orm"
import type { Asset, AssetBotsClient } from "../api/assetbots"
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
		checkoutId: string,
		autoSend: boolean,
		assetIds: string[]
	): Promise<void> {
		// Check if already processed for email purposes
		if (await this.isProcessed("checkout", checkoutId)) {
			return
		}

		// Fetch full checkout details from API
		const checkoutDetails = await this.client.getCheckout(checkoutId)
		if (!checkoutDetails) {
			console.log(`Checkout ${checkoutId} not found in API`)
			return
		}

		// Store active checkout for each asset
		const checkoutDate = new Date(checkoutDetails.date)
		for (const assetId of assetIds) {
			await this.storeActiveCheckout({
				assetId,
				checkoutId,
				checkoutDate,
				status: "active"
			})
		}

		// Extract assets from checkout details
		const assets =
			checkoutDetails.assets?.map((a) => ({
				description: a.value.description || a.value.tag || a.id,
				tag: a.value.tag,
				category: undefined
			})) || []

		if (assets.length === 0) {
			console.log(`Checkout ${checkoutId} has no assets`)
			return
		}

		// Check if checkout is late (only if there's a due date and it's in the past)
		let isLate = false
		let hoursLate = 0

		if (checkoutDetails.dueDate) {
			const dueDate = new Date(checkoutDetails.dueDate)
			const now = new Date()
			if (now > dueDate) {
				isLate = true
				hoursLate = Math.round(
					(now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)
				)
			}
		}

		// Check if this is a location-only checkout (no person)
		const hasPerson = !!checkoutDetails.person
		const personName = checkoutDetails.person?.value.name || "Unknown"

		// TODO: Extract returnTo from custom fields when structure is known
		const returnTo = undefined

		const assetsList =
			assets.length === 1
				? assets[0]!.description
				: assets.length === 2
					? `${assets[0]!.description} and ${assets[1]!.description}`
					: `${assets
							.slice(0, -1)
							.map((a) => a.description)
							.join(", ")}, and ${assets[assets.length - 1]!.description}`

		if (isLate) {
			if (autoSend) {
				console.log(`✉️  Late notification: ${assetsList}`)
				await this.emailService.sendLateNotification({
					itemType: "checkout",
					assets,
					personName,
					personEmail: undefined,
					date: checkoutDetails.date,
					hoursLate,
					returnTo,
					itemId: checkoutId,
					itemData: {
						assets,
						personName,
						personEmail: undefined,
						checkoutDate: checkoutDetails.date,
						dueDate: checkoutDetails.dueDate,
						returnTo
					}
				})
			} else {
				console.log(`⊘ Skipped late notification: ${assetsList} (>1hr old)`)
				const subject = `[LATE] Checkout: ${assetsList}`
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
								assets,
								personName,
								personEmail: undefined,
								checkoutDate: checkoutDetails.date,
								dueDate: checkoutDetails.dueDate,
								returnTo
							}
						},
						"Checkout older than 1 hour"
					)
				}
			}
		} else {
			if (hasPerson) {
				if (autoSend) {
					console.log(`✉️  Checkout confirmation: ${assetsList}`)
					await this.emailService.sendCheckoutConfirmation({
						assets,
						personName,
						personEmail: undefined,
						checkoutDate: checkoutDetails.date,
						dueDate: checkoutDetails.dueDate,
						returnTo,
						itemId: checkoutId,
						checkoutData: {
							assets,
							personName,
							personEmail: undefined,
							checkoutDate: checkoutDetails.date,
							dueDate: checkoutDetails.dueDate,
							returnTo
						}
					})
				} else {
					console.log(
						`⊘ Skipped checkout confirmation: ${assetsList} (>1hr old)`
					)
					const subject = `Checkout Confirmation: ${assetsList}`
					const recipient = undefined
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
								assets,
								personName,
								personEmail: undefined,
								checkoutDate: checkoutDetails.date,
								dueDate: checkoutDetails.dueDate,
								returnTo
							}
						},
						"Checkout older than 1 hour"
					)
				}
			} else {
				console.log(`✓ Checkout stored: ${assetsList}`)
			}
		}

		// Mark as processed for each asset
		for (const assetId of assetIds) {
			await this.markProcessed({
				itemType: "checkout",
				itemId: checkoutId,
				assetId,
				createdAt: checkoutDate,
				processedAt: new Date()
			})
		}
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

		const assets = [
			{
				description: asset.description || asset.tag || asset.id,
				tag: asset.tag,
				category: asset.category?.value
			}
		]

		const createdDate = asset.updateDate
			? new Date(asset.updateDate)
			: new Date()

		console.log(`✉️  Repair notification: ${assets[0]!.description}`)
		await this.emailService.sendRepairNotification({
			assets,
			status: repairValue.status,
			description: repairValue.description,
			dueDate: repairValue.dueDate,
			repairDate: repairValue.repairDate,
			itemId: repairId,
			repairData: {
				assets,
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
		const activeCheckout = await this.getActiveCheckout(asset.id)

		if (!activeCheckout) {
			return
		}

		// Check if already processed as a check-in
		const checkinId = `checkin_${activeCheckout.checkoutId}`
		if (await this.isProcessed("checkin", checkinId)) {
			return
		}

		console.log(
			`Detected check-in for asset ${asset.id}, fetching checkout details...`
		)

		try {
			const checkoutDetails = await this.client.getCheckout(
				activeCheckout.checkoutId
			)

			if (!checkoutDetails) {
				console.log(`Checkout ${activeCheckout.checkoutId} not found in API`)
				return
			}

			// If status is not "CheckedOut", it means it's been checked in
			if (checkoutDetails.status !== "CheckedOut") {
				const assets =
					checkoutDetails.assets?.map((a) => ({
						description: a.value.description || a.value.tag || a.id,
						tag: a.value.tag,
						category: undefined
					})) || []

				if (assets.length === 0) {
					console.log(`Checkout ${activeCheckout.checkoutId} has no assets`)
					return
				}

				const assetsList =
					assets.length === 1
						? assets[0]!.description
						: assets.length === 2
							? `${assets[0]!.description} and ${assets[1]!.description}`
							: `${assets
									.slice(0, -1)
									.map((a) => a.description)
									.join(", ")}, and ${assets[assets.length - 1]!.description}`

				console.log(`Processing check-in for ${assetsList}`)

				const checkoutDate = new Date(activeCheckout.checkoutDate)
				const checkInDate = new Date()
				const daysOut = Math.round(
					(checkInDate.getTime() - checkoutDate.getTime()) /
						(1000 * 60 * 60 * 24)
				)

				const personName = checkoutDetails.person?.value.name || "Unknown"

				console.log(`✉️  Check-in notification: ${assetsList}`)
				await this.emailService.sendCheckInNotification({
					assets,
					personName,
					checkoutDate: activeCheckout.checkoutDate.toISOString(),
					checkInDate: checkInDate.toISOString(),
					daysOut,
					itemId: checkinId,
					checkInData: {
						assets,
						personName,
						checkoutDate: activeCheckout.checkoutDate.toISOString(),
						checkInDate: checkInDate.toISOString(),
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
			console.error(
				`Error fetching checkout details for asset ${asset.id}:`,
				error
			)
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

			// Group assets by checkout ID to process each checkout once
			const checkoutGroups = new Map<
				string,
				{ assetIds: string[]; date: Date; autoSend: boolean }
			>()

			for (const asset of assets) {
				if (asset.checkout) {
					const checkoutId = asset.checkout.id
					const checkoutDate = new Date(asset.checkout.value.date)
					const autoSend = checkoutDate >= oneHourAgo

					if (!checkoutGroups.has(checkoutId)) {
						checkoutGroups.set(checkoutId, {
							assetIds: [],
							date: checkoutDate,
							autoSend
						})
					}
					checkoutGroups.get(checkoutId)!.assetIds.push(asset.id)
				}
			}

			// Process each checkout once with all its assets
			for (const [checkoutId, { assetIds, autoSend }] of checkoutGroups) {
				try {
					await this.processCheckout(checkoutId, autoSend, assetIds)
				} catch (error) {
					console.error(`Error processing checkout ${checkoutId}:`, error)
				}
			}

			// Process check-ins and repairs per asset
			for (const asset of assets) {
				try {
					// Check for check-ins (no checkout but have active record)
					if (!asset.checkout) {
						await this.processCheckIn(asset)
					}

					// Process repairs
					if (asset.repair) {
						await this.processRepair(asset)
					}
				} catch (error) {
					console.error(`Error processing asset ${asset.id}:`, error)
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
