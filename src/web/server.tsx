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

				// Ensure dates are properly serialized as ISO strings
				const serializedEmails = emails.map((email) => ({
					...email,
					sentAt:
						email.sentAt instanceof Date
							? email.sentAt.toISOString()
							: email.sentAt
				}))

				return new Response(JSON.stringify(serializedEmails), {
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

				// Filter out archived assets
				const filteredAssets = {
					...assets,
					data: assets.data.filter((asset) => !asset.archived)
				}

				return new Response(JSON.stringify(filteredAssets), {
					headers: { "Content-Type": "application/json" }
				})
			}

			// API: Get unique categories
			if (url.pathname === "/api/categories") {
				const allAssets = await config.assetBotsClient.getAllAssets()
				const categories = new Set<string>()

				for (const asset of allAssets) {
					if (asset.category?.value) {
						categories.add(asset.category.value)
					}
				}

				return new Response(JSON.stringify(Array.from(categories).sort()), {
					headers: { "Content-Type": "application/json" }
				})
			}

			// API: Get unique locations
			if (url.pathname === "/api/locations") {
				const allLocations = await config.assetBotsClient.getAllLocations()

				const locations = allLocations
					.map((location) => ({
						id: location.id,
						name: location.name
					}))
					.sort((a, b) => a.name.localeCompare(b.name))

				return new Response(JSON.stringify(locations), {
					headers: { "Content-Type": "application/json" }
				})
			}

			// API: Get unique people
			if (url.pathname === "/api/people") {
				const allPeople = await config.assetBotsClient.getAllPeople()

				const people = allPeople
					.map((person) => ({
						id: person.id,
						name: person.name
					}))
					.sort((a, b) => a.name.localeCompare(b.name))

				return new Response(JSON.stringify(people), {
					headers: { "Content-Type": "application/json" }
				})
			}

			// API: Get filtered assets
			if (url.pathname === "/api/assets/filter") {
				const filterType = url.searchParams.get("type")
				const filterValue = url.searchParams.get("value")
				const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10)
				const offset = Number.parseInt(
					url.searchParams.get("offset") || "0",
					10
				)

				if (!filterType || !filterValue) {
					return new Response(
						JSON.stringify({ error: "Filter type and value required" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" }
						}
					)
				}

				let result: { data: import("../api/assetbots").Asset[] }
				let total = 0

				if (filterType === "location") {
					// Use dedicated location assets endpoint
					result = await config.assetBotsClient.getLocationAssets(filterValue, {
						limit,
						offset
					})
					// Filter out archived assets
					result.data = result.data.filter((asset) => !asset.archived)
					total = result.data.length
				} else if (filterType === "person") {
					// Use dedicated person assets endpoint
					result = await config.assetBotsClient.getPersonAssets(filterValue, {
						limit,
						offset
					})
					// Filter out archived assets
					result.data = result.data.filter((asset) => !asset.archived)
					total = result.data.length
				} else if (filterType === "category") {
					// Use $filter parameter with OData syntax
					result = await config.assetBotsClient.getAssets({
						limit,
						offset,
						$filter: `category eq '${filterValue}'`
					})
					// Filter out archived assets
					result.data = result.data.filter((asset) => !asset.archived)
					total = result.data.length
				} else {
					return new Response(
						JSON.stringify({ error: "Invalid filter type" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" }
						}
					)
				}

				return new Response(
					JSON.stringify({
						data: result.data,
						total
					}),
					{
						headers: { "Content-Type": "application/json" }
					}
				)
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
					const category = asset.category?.value
					const returnTo = undefined // TODO: Extract from custom fields

					if (emailType === "checkout" && asset.checkout) {
						const { checkout } = asset
						const checkoutValue = checkout.value
						const hasPerson = !!checkoutValue.person
						const personName = checkoutValue.person?.value.name || "Unknown"
						const locationName = checkoutValue.location?.value.name

						// Only send checkout confirmation if there's a person
						// Location-only checkouts don't need confirmation emails
						if (!hasPerson) {
							return new Response(
								JSON.stringify({
									error: `Cannot send checkout email: checked out to location only (${locationName})`
								}),
								{
									status: 400,
									headers: { "Content-Type": "application/json" }
								}
							)
						}

						await config.emailService.sendCheckoutConfirmation({
							itemId: checkout.id,
							assetName,
							personName,
							personEmail: undefined, // API doesn't provide email on person
							checkoutDate: checkoutValue.date,
							dueDate: checkoutValue.dueDate,
							category,
							returnTo,
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
					} else if (emailType === "repair" && asset.repair) {
						const { repair } = asset
						const repairValue = repair.value
						await config.emailService.sendRepairNotification({
							itemId: repair.id,
							assetName,
							status: repairValue.status,
							description: repairValue.description,
							dueDate: repairValue.dueDate,
							repairDate: repairValue.repairDate,
							repairData: {
								assetName,
								status: repairValue.status,
								description: repairValue.description,
								dueDate: repairValue.dueDate,
								repairDate: repairValue.repairDate
							}
						})
					} else if (emailType === "late" && asset.checkout) {
						const { checkout } = asset
						const checkoutValue = checkout.value
						const personName = checkoutValue.person?.value.name || "Unknown"
						const checkoutDate = new Date(checkoutValue.date)
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
							date: new Date(checkoutValue.date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric"
							}),
							hoursLate,
							category,
							returnTo,
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
