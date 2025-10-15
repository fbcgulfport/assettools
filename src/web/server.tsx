import { desc } from "drizzle-orm"
import { getAssetName } from "../api/assetbots"
import { db, emailHistory } from "../db"
import type { EmailService } from "../services/email"

export interface WebServerConfig {
	port: number
	emailService: EmailService
	assetBotsClient: import("../api/assetbots").AssetBotsClient
}

import homePage from "./index.html"

export function createWebServer(config: WebServerConfig) {
	return Bun.serve({
		port: config.port,
		routes: {
			"/": homePage
		},
		async fetch(req) {
			const url = new URL(req.url)
			// API: Get email history
			if (url.pathname === "/api/emails") {
				const limit = Number.parseInt(
					url.searchParams.get("limit") || "100",
					10
				)
				const emails = await db
					.select()
					.from(emailHistory)
					.orderBy(desc(emailHistory.sentAt))
					.limit(limit)

				return new Response(JSON.stringify(emails), {
					headers: { "Content-Type": "application/json" }
				})
			}

			// API: Get assets
			if (url.pathname === "/api/assets") {
				const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10)
				const offset = Number.parseInt(
					url.searchParams.get("offset") || "0",
					10
				)
				const assets = await config.assetBotsClient.getAssets({ limit, offset })

				return new Response(JSON.stringify(assets), {
					headers: { "Content-Type": "application/json" }
				})
			}

			// API: Send email for asset
			if (url.pathname === "/api/send-email" && req.method === "POST") {
				try {
					const body = (await req.json()) as {
						assetId?: string
						emailType?: string
					}
					const { assetId, emailType } = body

					if (!assetId || !emailType) {
						return new Response(
							JSON.stringify({ error: "Asset ID and email type required" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" }
							}
						)
					}

					// Fetch asset data
					const assetsResponse = await config.assetBotsClient.getAssets({
						$filter: `id eq '${assetId}'`
					})

					if (!assetsResponse.data || assetsResponse.data.length === 0) {
						return new Response(JSON.stringify({ error: "Asset not found" }), {
							status: 404,
							headers: { "Content-Type": "application/json" }
						})
					}

					const asset = assetsResponse.data[0]
					if (!asset) {
						return new Response(JSON.stringify({ error: "Asset not found" }), {
							status: 404,
							headers: { "Content-Type": "application/json" }
						})
					}

					// Send appropriate email based on type
					const assetName = getAssetName(asset)

					if (emailType === "checkout" && asset.checkout) {
						const { checkout } = asset
						const personName = checkout.person?.name || "Unknown"

						await config.emailService.sendCheckoutConfirmation({
							itemId: checkout.id,
							assetName,
							personName,
							personEmail: undefined, // API doesn't provide email on person
							checkoutDate: checkout.date,
							dueDate: checkout.dueDate,
							checkoutData: {
								assetName,
								personName,
								personEmail: undefined,
								checkoutDate: checkout.date,
								dueDate: checkout.dueDate
							}
						})
					} else if (emailType === "repair" && asset.repair) {
						const { repair } = asset
						await config.emailService.sendRepairNotification({
							itemId: repair.id,
							assetName,
							status: repair.status,
							description: repair.description,
							dueDate: repair.dueDate,
							repairDate: repair.repairDate,
							repairData: {
								assetName,
								status: repair.status,
								description: repair.description,
								dueDate: repair.dueDate,
								repairDate: repair.repairDate
							}
						})
					} else if (emailType === "late" && asset.checkout) {
						const { checkout } = asset
						const personName = checkout.person?.name || "Unknown"
						const checkoutDate = new Date(checkout.date)
						const now = new Date()
						const hoursLate = Math.floor(
							(now.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60)
						)

						await config.emailService.sendLateNotification({
							itemId: checkout.id,
							itemType: "checkout",
							assetName,
							personName,
							personEmail: undefined, // API doesn't provide email on person
							date: new Date(checkout.date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric"
							}),
							hoursLate,
							itemData: {
								assetName,
								personName,
								personEmail: undefined,
								checkoutDate: checkout.date,
								dueDate: checkout.dueDate
							}
						})
					} else {
						return new Response(
							JSON.stringify({ error: "Invalid email type or missing data" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" }
							}
						)
					}

					return new Response(JSON.stringify({ success: true }), {
						headers: { "Content-Type": "application/json" }
					})
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error)
					return new Response(JSON.stringify({ error: message }), {
						status: 500,
						headers: { "Content-Type": "application/json" }
					})
				}
			}

			// API: Resend email
			if (url.pathname === "/api/resend" && req.method === "POST") {
				try {
					const body = (await req.json()) as { id?: number }
					const { id } = body

					if (!id || typeof id !== "number") {
						return new Response(
							JSON.stringify({ error: "Email ID required" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" }
							}
						)
					}

					await config.emailService.resendEmail(id)

					return new Response(JSON.stringify({ success: true }), {
						headers: { "Content-Type": "application/json" }
					})
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error)
					return new Response(JSON.stringify({ error: message }), {
						status: 500,
						headers: { "Content-Type": "application/json" }
					})
				}
			}

			return new Response("Not Found", { status: 404 })
		}
	})
}
