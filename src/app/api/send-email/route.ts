import { NextResponse } from "next/server"
import { getAssetBotsClient, getEmailService } from "~/lib/clients"

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as { assetId?: string; emailType?: string }
		const { assetId, emailType } = body

		if (!assetId || !emailType) {
			return NextResponse.json(
				{ error: "Asset ID and email type required" },
				{ status: 400 }
			)
		}

		const client = getAssetBotsClient()
		const emailService = getEmailService()
		const assetsResponse = await client.getAssets({
			$filter: `id eq '${assetId}'`
		})

		if (!assetsResponse.data || assetsResponse.data.length === 0) {
			return NextResponse.json({ error: "Asset not found" }, { status: 404 })
		}

		const asset = assetsResponse.data[0]
		if (!asset) {
			return NextResponse.json({ error: "Asset not found" }, { status: 404 })
		}

		const returnTo = undefined

		if (emailType === "checkout" && asset.checkout) {
			const checkoutDetails = await client.getCheckout(asset.checkout.id)
			if (!checkoutDetails) {
				return NextResponse.json(
					{ error: "Checkout not found" },
					{ status: 404 }
				)
			}

			const hasPerson = !!checkoutDetails.person
			const personName = checkoutDetails.person?.value.name || "Unknown"
			const locationName = checkoutDetails.location?.value.name

			if (!hasPerson) {
				return NextResponse.json(
					{
						error: `Cannot send checkout email: checked out to location only (${locationName})`
					},
					{ status: 400 }
				)
			}

			const assets =
				checkoutDetails.assets?.map((a) => ({
					description: a.value.description || a.value.tag || a.id,
					tag: a.value.tag,
					category: undefined
				})) || []

			if (assets.length === 0) {
				return NextResponse.json(
					{ error: "Checkout has no assets" },
					{ status: 400 }
				)
			}

			await emailService.sendCheckoutConfirmation({
				itemId: asset.checkout.id,
				assets,
				personName,
				personEmail: undefined,
				checkoutDate: checkoutDetails.date,
				dueDate: checkoutDetails.dueDate,
				returnTo,
				checkoutData: {
					assets,
					personName,
					personEmail: undefined,
					checkoutDate: checkoutDetails.date,
					dueDate: checkoutDetails.dueDate,
					returnTo
				}
			})
		} else if (emailType === "repair" && asset.repair) {
			const { repair } = asset
			const repairValue = repair.value
			const assets = [
				{
					description: asset.description || asset.tag || asset.id,
					tag: asset.tag,
					category: asset.category?.value
				}
			]

			await emailService.sendRepairNotification({
				itemId: repair.id,
				assets,
				status: repairValue.status,
				description: repairValue.description,
				dueDate: repairValue.dueDate,
				repairDate: repairValue.repairDate,
				repairData: {
					assets,
					status: repairValue.status,
					description: repairValue.description,
					dueDate: repairValue.dueDate,
					repairDate: repairValue.repairDate
				}
			})
		} else if (emailType === "late" && asset.checkout) {
			const checkoutDetails = await client.getCheckout(asset.checkout.id)
			if (!checkoutDetails) {
				return NextResponse.json(
					{ error: "Checkout not found" },
					{ status: 404 }
				)
			}

			const personName = checkoutDetails.person?.value.name || "Unknown"
			const checkoutDate = new Date(checkoutDetails.date)
			const now = new Date()
			const hoursLate = Math.floor(
				(now.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60)
			)

			const assets =
				checkoutDetails.assets?.map((a) => ({
					description: a.value.description || a.value.tag || a.id,
					tag: a.value.tag,
					category: undefined
				})) || []

			if (assets.length === 0) {
				return NextResponse.json(
					{ error: "Checkout has no assets" },
					{ status: 400 }
				)
			}

			await emailService.sendLateNotification({
				itemId: asset.checkout.id,
				itemType: "checkout",
				assets,
				personName,
				personEmail: undefined,
				date: new Date(checkoutDetails.date).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric"
				}),
				hoursLate,
				returnTo,
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
			return NextResponse.json(
				{ error: "Invalid email type or missing data" },
				{ status: 400 }
			)
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
