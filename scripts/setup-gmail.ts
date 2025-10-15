#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { parse } from "node:url"
import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
const TOKEN_PATH = ".gmail-token.json"
const CREDENTIALS_PATH = "gmail-credentials.json"

interface Credentials {
	installed?: {
		client_id: string
		client_secret: string
		redirect_uris: string[]
	}
	web?: {
		client_id: string
		client_secret: string
		redirect_uris: string[]
	}
}

async function loadCredentials(): Promise<Credentials> {
	if (!existsSync(CREDENTIALS_PATH)) {
		console.error(`\nError: ${CREDENTIALS_PATH} not found!\n`)
		console.log("Please follow these steps:")
		console.log("1. Go to https://console.cloud.google.com/")
		console.log("2. Create a new project or select an existing one")
		console.log("3. Enable the Gmail API")
		console.log("4. Go to Credentials → Create Credentials → OAuth client ID")
		console.log('5. Choose "Desktop app" or "Web application"')
		console.log(
			"6. Download the JSON file and save it as gmail-credentials.json"
		)
		console.log(
			'7. If you chose "Web application", add http://localhost:3001 to authorized redirect URIs\n'
		)
		process.exit(1)
	}

	const content = readFileSync(CREDENTIALS_PATH, "utf-8")
	return JSON.parse(content)
}

async function authorize(): Promise<void> {
	const credentials = await loadCredentials()

	const keys = credentials.installed || credentials.web
	if (!keys) {
		console.error("Invalid credentials file format")
		process.exit(1)
	}

	const oauth2Client = new google.auth.OAuth2(
		keys.client_id,
		keys.client_secret,
		keys.redirect_uris[0] || "http://localhost:3001"
	)

	// Check if we already have a token
	if (existsSync(TOKEN_PATH)) {
		const token = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"))
		oauth2Client.setCredentials(token)

		console.log("\n✓ Existing token found!")
		await updateEnvFile(oauth2Client)
		return
	}

	// Generate auth URL
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES
	})

	console.log("\n" + "=".repeat(60))
	console.log("Gmail API Setup - OAuth2 Authorization")
	console.log("=".repeat(60))
	console.log("\nPlease authorize this app by visiting this URL:\n")
	console.log(authUrl)
	console.log("\n" + "=".repeat(60))

	// Start local server to receive the callback
	const server = createServer(async (req, res) => {
		try {
			if (req.url?.indexOf("/") === 0) {
				const qs = parse(req.url, true).query
				const code = qs.code as string

				if (code) {
					res.writeHead(200, { "Content-Type": "text/html" })
					res.end(
						"<h1>Authorization successful!</h1><p>You can close this window and return to the terminal.</p>"
					)

					// Get the access token
					const { tokens } = await oauth2Client.getToken(code)
					oauth2Client.setCredentials(tokens)

					// Save token to file
					writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))
					console.log("\n✓ Token saved to", TOKEN_PATH)

					// Update .env file
					await updateEnvFile(oauth2Client)

					server.close()
					process.exit(0)
				}
			}
		} catch (error) {
			console.error("Error during authorization:", error)
			res.writeHead(500)
			res.end("Error during authorization")
			process.exit(1)
		}
	})

	const port = 3001
	server.listen(port, () => {
		console.log(`\nWaiting for authorization... (listening on port ${port})`)
	})
}

async function updateEnvFile(oauth2Client: any): Promise<void> {
	const ENV_PATH = ".env"
	let envContent = ""

	// Read existing .env if it exists
	if (existsSync(ENV_PATH)) {
		envContent = readFileSync(ENV_PATH, "utf-8")
	}

	// Get credentials
	const credentials =
		oauth2Client.credentials || (await oauth2Client.getAccessToken()).token
	const credentialsJson = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8"))
	const keys = credentialsJson.installed || credentialsJson.web

	// Remove old SMTP variables and add Gmail API variables
	const lines = envContent.split("\n").filter((line) => {
		return !(
			line.startsWith("SMTP_") ||
			line.startsWith("GMAIL_CLIENT_ID=") ||
			line.startsWith("GMAIL_CLIENT_SECRET=") ||
			line.startsWith("GMAIL_REFRESH_TOKEN=") ||
			line.startsWith("GMAIL_ACCESS_TOKEN=") ||
			line.startsWith("GMAIL_TOKEN_EXPIRY=") ||
			line.startsWith("GMAIL_REDIRECT_URI=")
		)
	})

	// Find the email configuration section or create it
	let emailSectionIndex = lines.findIndex((line) =>
		line.includes("# Email Configuration")
	)
	if (emailSectionIndex === -1) {
		emailSectionIndex = lines.findIndex(
			(line) => line.startsWith("FROM_EMAIL=") || line.startsWith("FROM_NAME=")
		)
		if (emailSectionIndex > 0) {
			lines.splice(emailSectionIndex, 0, "# Email Configuration")
		}
	}

	// Add Gmail API credentials
	const gmailConfig = [
		"",
		"# Gmail API Configuration",
		`GMAIL_CLIENT_ID=${keys.client_id}`,
		`GMAIL_CLIENT_SECRET=${keys.client_secret}`,
		`GMAIL_REDIRECT_URI=${keys.redirect_uris[0] || "http://localhost:3001"}`,
		`GMAIL_REFRESH_TOKEN=${credentials.refresh_token || ""}`,
		`GMAIL_ACCESS_TOKEN=${credentials.access_token || ""}`,
		`GMAIL_TOKEN_EXPIRY=${credentials.expiry_date || ""}`
	]

	if (emailSectionIndex !== -1 && emailSectionIndex < lines.length - 1) {
		lines.splice(emailSectionIndex + 1, 0, ...gmailConfig)
	} else {
		lines.push(...gmailConfig)
	}

	// Write back to .env
	writeFileSync(ENV_PATH, lines.join("\n"))
	console.log("✓ .env file updated with Gmail API credentials")
	console.log(
		"\nNote: Make sure to set FROM_EMAIL and FROM_NAME in your .env file"
	)
	console.log(
		"\nSetup complete! You can now use the Gmail API for sending emails."
	)
}

// Run the authorization flow
authorize().catch(console.error)
