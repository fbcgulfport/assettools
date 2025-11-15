import { NextResponse } from "next/server"
import { getAssetBotsClient } from "~/lib/clients"

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const filterType = searchParams.get("type")
	const filterValue = searchParams.get("value")
	const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
	const offset = Number.parseInt(searchParams.get("offset") || "0", 10)

	if (!filterType || !filterValue) {
		return NextResponse.json(
			{ error: "Filter type and value required" },
			{ status: 400 }
		)
	}

	const client = getAssetBotsClient()
	let result: { data: Awaited<ReturnType<typeof client.getAssets>>["data"] }
	let total = 0

	if (filterType === "location") {
		result = await client.getLocationAssets(filterValue, { limit, offset })
		result.data = result.data.filter((asset) => !asset.archived)
		total = result.data.length
	} else if (filterType === "person") {
		result = await client.getPersonAssets(filterValue, { limit, offset })
		result.data = result.data.filter((asset) => !asset.archived)
		total = result.data.length
	} else if (filterType === "category") {
		result = await client.getAssets({
			limit,
			offset,
			$filter: `category eq '${filterValue}'`
		})
		result.data = result.data.filter((asset) => !asset.archived)
		total = result.data.length
	} else {
		return NextResponse.json({ error: "Invalid filter type" }, { status: 400 })
	}

	return NextResponse.json({ data: result.data, total })
}
