import { NextResponse } from "next/server"
import { getAssetBotsClient } from "~/lib/clients"

export async function GET() {
	const client = getAssetBotsClient()
	const allLocations = await client.getAllLocations()

	const locations = allLocations
		.map((location) => ({
			id: location.id,
			name: location.name
		}))
		.sort((a, b) => a.name.localeCompare(b.name))

	return NextResponse.json(locations)
}
