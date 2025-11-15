import { NextResponse } from "next/server"
import { getEmailService } from "~/lib/clients"

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as { id?: number }
		const { id } = body

		if (!id || typeof id !== "number") {
			return NextResponse.json({ error: "Email ID required" }, { status: 400 })
		}

		const emailService = getEmailService()
		await emailService.resendEmail(id)

		return NextResponse.json({ success: true })
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
