import { and, eq } from "drizzle-orm"
import type { Asset, AssetBotsClient } from "../api/assetbots"
import { getAssetName } from "../api/assetbots"
import { db, type NewProcessedItem, processedItems } from "../db"
import type { EmailService } from "./email"

export class AssetPoller {
	private client: AssetBotsClient
	private emailService: EmailService
	private lastCheckTime: Date
	private isRunning = false

	constructor(client: AssetBotsClient, emailService: EmailService) {
		this.client = client
		this.emailService = emailService
		// Start checking from 5 minutes ago to ensure we catch recent items
		this.lastCheckTime = new Date(Date.now() - 5 * 60 * 1000)
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

	private async processCheckout(asset: Asset): Promise<void> {
		if (!asset.checkout) return

		const checkout = asset.checkout
		const checkoutId = checkout.id

		// Check if already processed
		if (await this.isProcessed("checkout", checkoutId)) {
			return
		}

		const checkoutDate = new Date(checkout.date)
		const hoursSinceCreation =
			(Date.now() - checkoutDate.getTime()) / (1000 * 60 * 60)
		const isLate = hoursSinceCreation > 2

		const assetName = getAssetName(asset)
		console.log(`Processing checkout: ${checkoutId} for asset ${assetName}`)

		const personName = checkout.person?.name || "Unknown"

		if (isLate) {
			// Send late notification to admins only
			await this.emailService.sendLateNotification({
				itemType: "checkout",
				assetName,
				personName,
				personEmail: undefined, // API doesn't provide email on person
				date: checkout.date,
				hoursLate: Math.round(hoursSinceCreation),
				itemId: checkoutId,
				itemData: {
					assetName,
					personName,
					personEmail: undefined,
					checkoutDate: checkout.date,
					dueDate: checkout.dueDate
				}
			})
		} else {
			// Send normal confirmation
			await this.emailService.sendCheckoutConfirmation({
				assetName,
				personName,
				personEmail: undefined, // API doesn't provide email on person
				checkoutDate: checkout.date,
				dueDate: checkout.dueDate,
				itemId: checkoutId,
				checkoutData: {
					assetName,
					personName,
					personEmail: undefined,
					checkoutDate: checkout.date,
					dueDate: checkout.dueDate
				}
			})
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

		// Check if already processed
		if (await this.isProcessed("repair", repairId)) {
			return
		}

		const assetName = getAssetName(asset)
		const createdDate = asset.updateDate
			? new Date(asset.updateDate)
			: new Date()

		console.log(`Processing repair: ${repairId} for asset ${assetName}`)

		// Repairs always go to admins only, no late logic
		await this.emailService.sendRepairNotification({
			assetName,
			status: repair.status,
			description: repair.description,
			dueDate: repair.dueDate,
			repairDate: repair.repairDate,
			itemId: repairId,
			repairData: {
				assetName,
				status: repair.status,
				description: repair.description,
				dueDate: repair.dueDate,
				repairDate: repair.repairDate
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

	async poll(): Promise<void> {
		if (this.isRunning) {
			console.log("Poll already running, skipping...")
			return
		}

		this.isRunning = true

		try {
			console.log(
				`Polling for changes since ${this.lastCheckTime.toISOString()}`
			)

			const assets = await this.client.getRecentAssets(this.lastCheckTime)

			console.log(`Found ${assets.length} assets with recent changes`)

			for (const asset of assets) {
				try {
					// Process checkout if exists
					if (asset.checkout) {
						await this.processCheckout(asset)
					}

					// Process repair if exists
					if (asset.repair) {
						await this.processRepair(asset)
					}
				} catch (error) {
					console.error(`Error processing asset ${asset.id}:`, error)
					// Continue processing other assets
				}
			}

			// Update last check time
			this.lastCheckTime = new Date()
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
