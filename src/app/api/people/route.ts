import { NextResponse } from "next/server"
import { getAssetBotsClient } from "~/lib/clients"

export async function GET() {
	const client = getAssetBotsClient()
	const allPeople = await client.getAllPeople()

	const people = allPeople
		.map((person) => ({
			id: person.id,
			name: person.name
		}))
		.sort((a, b) => a.name.localeCompare(b.name))

	return NextResponse.json(people)
}
