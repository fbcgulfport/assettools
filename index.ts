import { AssetBotsClient } from "./src/api/assetbots"
import { EmailService } from "./src/services/email"
import { AssetPoller } from "./src/services/poller"
import { createWebServer } from "./src/web/server"

// Load environment variables
const ASSETBOTS_API_KEY = process.env.ASSETBOTS_API_KEY
const ASSETBOTS_API_URL =
	process.env.ASSETBOTS_API_URL || "https://api.assetbots.com/v1"
const CHECK_MINUTES = Number.parseInt(process.env.CHECK_MINUTES || "1")
const PORT = Number.parseInt(process.env.PORT || "3000")

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
const SMTP_SECURE = process.env.SMTP_SECURE === "true"
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD

const FROM_EMAIL = process.env.FROM_EMAIL
const FROM_NAME = process.env.FROM_NAME || "Asset Management System"
const ADMIN_EMAILS =
	process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || []

// Validate required environment variables
if (!ASSETBOTS_API_KEY) {
	console.error("Error: ASSETBOTS_API_KEY is required")
	process.exit(1)
}

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
	console.error(
		"Error: SMTP credentials are required (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)"
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
	host: SMTP_HOST,
	port: SMTP_PORT,
	secure: SMTP_SECURE,
	auth: {
		user: SMTP_USER,
		pass: SMTP_PASSWORD
	},
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
const server = createWebServer({
	port: PORT,
	emailService
})

console.log(`\n✓ Web UI running at http://localhost:${PORT}`)
console.log("✓ Polling service started")
console.log("\nPress Ctrl+C to stop\n")
