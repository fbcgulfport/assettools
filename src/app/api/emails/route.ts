import { desc } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db, emailHistory } from "~/db"

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const limit = Number.parseInt(searchParams.get("limit") || "100", 10)

	const emails = await db
		.select()
		.from(emailHistory)
		.orderBy(desc(emailHistory.sentAt))
		.limit(limit)

	const serializedEmails = emails.map((email) => ({
		...email,
		sentAt:
			email.sentAt instanceof Date ? email.sentAt.toISOString() : email.sentAt
	}))

	return NextResponse.json(serializedEmails)
}
