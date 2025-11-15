import { NextResponse } from "next/server"
import { getAssetBotsClient } from "~/lib/clients"

export async function GET() {
	const client = getAssetBotsClient()
	const allAssets = await client.getAllAssets()
	const categories = new Set<string>()

	for (const asset of allAssets) {
		if (asset.category?.value) {
			categories.add(asset.category.value)
		}
	}

	return NextResponse.json(Array.from(categories).sort())
}
