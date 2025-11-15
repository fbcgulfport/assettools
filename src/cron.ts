import cron from "node-cron"
import { AssetBotsClient } from "./api/assetbots"
import { EmailService } from "./services/email"
import { AssetPoller } from "./services/poller"

const client = new AssetBotsClient({
	apiKey: process.env.ASSETBOTS_API_KEY!,
	apiUrl: process.env.ASSETBOTS_API_URL!
})

const emailService = new EmailService({
	clientId: process.env.GMAIL_CLIENT_ID!,
	clientSecret: process.env.GMAIL_CLIENT_SECRET!,
	redirectUri: process.env.GMAIL_REDIRECT_URI!,
	refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
	accessToken: process.env.GMAIL_ACCESS_TOKEN!,
	tokenExpiry: Number.parseInt(process.env.GMAIL_TOKEN_EXPIRY || "0", 10),
	from: {
		email: process.env.FROM_EMAIL!,
		name: process.env.FROM_NAME!
	},
	adminEmails: process.env.ADMIN_EMAILS!.split(",").map((e) => e.trim())
})

const poller = new AssetPoller(client, emailService)

const checkMinutes = Number.parseInt(process.env.CHECK_MINUTES || "1", 10)

console.log(`Starting cron job with ${checkMinutes} minute interval`)

cron.schedule(`*/${checkMinutes} * * * *`, async () => {
	console.log("Running scheduled poll...")
	await poller.poll()
})

console.log("Running initial poll...")
poller.poll()

console.log("Cron job started")
