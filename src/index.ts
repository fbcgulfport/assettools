import { AssetBotsClient } from "~/api/assetbots"
import { EmailService } from "~/services/email"
import { AssetPoller } from "~/services/poller"
import { createWebServer } from "~/web/server"

// Load environment variables
const ASSETBOTS_API_KEY = process.env.ASSETBOTS_API_KEY
const ASSETBOTS_API_URL =
	process.env.ASSETBOTS_API_URL || "https://api.assetbots.com/v1"
const CHECK_MINUTES = Number.parseInt(process.env.CHECK_MINUTES || "1", 10)
const PORT = Number.parseInt(process.env.PORT || "3000", 10)

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const GMAIL_REDIRECT_URI =
	process.env.GMAIL_REDIRECT_URI || "http://localhost:3001"
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN
const GMAIL_ACCESS_TOKEN = process.env.GMAIL_ACCESS_TOKEN
const GMAIL_TOKEN_EXPIRY = process.env.GMAIL_TOKEN_EXPIRY
	? Number.parseInt(process.env.GMAIL_TOKEN_EXPIRY, 10)
	: undefined

const FROM_EMAIL = process.env.FROM_EMAIL
const FROM_NAME = process.env.FROM_NAME || "Asset Management System"
const ADMIN_EMAILS =
	process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || []

// Validate required environment variables
if (!ASSETBOTS_API_KEY) {
	console.error("Error: ASSETBOTS_API_KEY is required")
	process.exit(1)
}

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
	console.error(
		"Error: Gmail API credentials are required (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)"
	)
	console.error(
		"Run `bun scripts/setup-gmail.ts` to set up Gmail API credentials"
	)
	process.exit(1)
}

if (!FROM_EMAIL) {
	console.error("Error: FROM_EMAIL is required")
	process.exit(1)
}

if (ADMIN_EMAILS.length === 0) {
	console.error("Error: At least one ADMIN_EMAIL is required")
	process.exit(1)
}

console.log("=".repeat(60))
console.log("Asset Tools - Starting up...")
console.log("=".repeat(60))
console.log(`API URL: ${ASSETBOTS_API_URL}`)
console.log(`Check Interval: ${CHECK_MINUTES} minute(s)`)
console.log(`Admin Emails: ${ADMIN_EMAILS.join(", ")}`)
console.log(`Web UI Port: ${PORT}`)
console.log("=".repeat(60))

// Initialize services
const assetBotsClient = new AssetBotsClient({
	apiKey: ASSETBOTS_API_KEY,
	apiUrl: ASSETBOTS_API_URL
})

const emailService = new EmailService({
	clientId: GMAIL_CLIENT_ID,
	clientSecret: GMAIL_CLIENT_SECRET,
	redirectUri: GMAIL_REDIRECT_URI,
	refreshToken: GMAIL_REFRESH_TOKEN,
	accessToken: GMAIL_ACCESS_TOKEN,
	tokenExpiry: GMAIL_TOKEN_EXPIRY,
	from: {
		email: FROM_EMAIL,
		name: FROM_NAME
	},
	adminEmails: ADMIN_EMAILS
})

const poller = new AssetPoller(assetBotsClient, emailService)

// Start the poller
poller.start(CHECK_MINUTES)

// Start the web server
const _server = createWebServer({
	port: PORT,
	emailService,
	assetBotsClient
})

console.log(`\n✓ Web UI running at http://localhost:${PORT}`)
console.log("✓ Polling service started")
console.log("\nPress Ctrl+C to stop\n")
