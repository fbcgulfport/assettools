import { NextResponse } from "next/server"
import { getAssetBotsClient } from "~/lib/clients"

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
	const offset = Number.parseInt(searchParams.get("offset") || "0", 10)

	const client = getAssetBotsClient()
	const assets = await client.getAssets({ limit, offset })

	const filteredAssets = {
		...assets,
		data: assets.data.filter((asset) => !asset.archived)
	}

	return NextResponse.json(filteredAssets)
}
