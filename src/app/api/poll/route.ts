import { NextResponse } from "next/server"
import { getAssetBotsClient, getEmailService } from "~/lib/clients"
import { AssetPoller } from "~/services/poller"

let poller: AssetPoller | null = null

export async function POST() {
	try {
		if (!poller) {
			const client = getAssetBotsClient()
			const emailService = getEmailService()
			poller = new AssetPoller(client, emailService)
		}

		await poller.poll()

		return NextResponse.json({ success: true, message: "Poll completed" })
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
