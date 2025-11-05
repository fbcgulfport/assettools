import { render } from "@react-email/render"
import { google } from "googleapis"
import { createElement as h } from "react"
import { db, emailHistory, type NewEmailHistory } from "../db"
import CheckInNotification, {
	type CheckInNotificationProps
} from "../emails/CheckInNotification"
import CheckoutConfirmation, {
	type CheckoutConfirmationProps
} from "../emails/CheckoutConfirmation"
import LateNotification, {
	type LateNotificationProps
} from "../emails/LateNotification"
import RepairNotification, {
	type RepairNotificationProps
} from "../emails/RepairNotification"
import ReservationConfirmation, {
	type ReservationConfirmationProps
} from "../emails/ReservationConfirmation"

// Stored email data types
export interface CheckoutEmailData {
	assetName: string
	personName: string
	personEmail?: string
	checkoutDate: string
	dueDate?: string
	notes?: string
	category?: string
	returnTo?: string
}

export interface ReservationEmailData {
	assetName: string
	personName: string
	personEmail?: string
	startDate: string
	endDate: string
	notes?: string
}

export interface RepairEmailData {
	assetName: string
	status?: string
	description?: string
	dueDate?: string
	repairDate?: string
}

export interface CheckInEmailData {
	assetName: string
	personName: string
	checkoutDate: string
	checkInDate: string
	category?: string
	daysOut?: number
}

export type EmailData =
	| CheckoutEmailData
	| ReservationEmailData
	| RepairEmailData
	| CheckInEmailData

export interface EmailConfig {
	clientId: string
	clientSecret: string
	redirectUri: string
	refreshToken: string
	accessToken?: string
	tokenExpiry?: number
	from: {
		email: string
		name: string
	}
	adminEmails: string[]
}

export class EmailService {
	private oauth2Client: any
	private gmail: any
	private config: EmailConfig

	constructor(config: EmailConfig) {
		this.config = config

		// Initialize OAuth2 client
		this.oauth2Client = new google.auth.OAuth2(
			config.clientId,
			config.clientSecret,
			config.redirectUri
		)

		// Set credentials
		this.oauth2Client.setCredentials({
			refresh_token: config.refreshToken,
			access_token: config.accessToken,
			expiry_date: config.tokenExpiry
		})

		// Initialize Gmail API
		this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client })
	}

	private async sendEmail(
		to: string,
		subject: string,
		html: string,
		metadata: Omit<
			NewEmailHistory,
			"sentAt" | "status" | "errorMessage" | "recipient" | "subject"
		>,
		cc?: string[]
	): Promise<number> {
		try {
			// Create email message in RFC 2822 format
			const headers = [
				`From: ${this.config.from.name} <${this.config.from.email}>`,
				`To: ${to}`,
				cc && cc.length > 0 ? `Cc: ${cc.join(", ")}` : "",
				`Reply-To: ${this.config.adminEmails[0]}`,
				`Subject: ${subject}`,
				"MIME-Version: 1.0",
				"Content-Type: text/html; charset=utf-8"
			]
				.filter(Boolean)
				.join("\r\n")

			const message = `${headers}\r\n\r\n${html}`

			// Encode message in base64url format
			const encodedMessage = Buffer.from(message)
				.toString("base64")
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=+$/, "")

			// Send via Gmail API
			await this.gmail.users.messages.send({
				userId: "me",
				requestBody: {
					raw: encodedMessage
				}
			})

			// Log success and return the inserted ID
			const result = await db
				.insert(emailHistory)
				.values({
					...metadata,
					recipient: to,
					subject,
					sentAt: new Date(),
					status: "sent"
				})
				.returning({ id: emailHistory.id })

			const ccInfo = cc ? ` (CC: ${cc.join(", ")})` : ""
			console.log(`✓ Email sent to ${to}${ccInfo}: ${subject}`)
			if (!result[0]) {
				throw new Error("Failed to insert email history record")
			}
			return result[0].id
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)

			// Log failure
			const result = await db
				.insert(emailHistory)
				.values({
					...metadata,
					recipient: to,
					subject,
					sentAt: new Date(),
					status: "failed",
					errorMessage
				})
				.returning({ id: emailHistory.id })

			console.error(`✗ Failed to send email to ${to}: ${errorMessage}`)
			if (!result[0]) {
				throw new Error("Failed to insert email history record")
			}
			return result[0].id
		}
	}

	async logSkippedEmail(
		recipient: string,
		subject: string,
		metadata: Omit<
			NewEmailHistory,
			"sentAt" | "status" | "errorMessage" | "recipient" | "subject"
		>,
		reason: string
	): Promise<void> {
		await db.insert(emailHistory).values({
			...metadata,
			recipient,
			subject,
			sentAt: new Date(),
			status: "skipped",
			errorMessage: reason
		})
		console.log(`⊘ Email skipped for ${recipient}: ${reason}`)
	}

	async sendCheckoutConfirmation(
		data: CheckoutConfirmationProps & {
			itemId: string
			checkoutData: CheckoutEmailData
		}
	): Promise<void> {
		// Only send emails in production
		if (process.env.NODE_ENV !== "production") {
			return
		}

		const html = await render(h(CheckoutConfirmation, data))
		const subject = `Checkout Confirmation: ${data.assetName}`

		// Send to user with admins CC'd, or send to admins if no user email
		if (data.personEmail) {
			// Check if user emails are disabled
			if (process.env.DISABLE_EMAILS === "true") {
				return
			}
			await this.sendEmail(
				data.personEmail,
				subject,
				html,
				{
					itemType: "checkout",
					itemId: data.itemId,
					isAdmin: false,
					isLate: false,
					needsManualSend: false,
					data: data.checkoutData
				},
				this.config.adminEmails
			)
		} else {
			// No user email, send to admins only
			for (const adminEmail of this.config.adminEmails) {
				await this.sendEmail(adminEmail, `[Admin] ${subject}`, html, {
					itemType: "checkout",
					itemId: data.itemId,
					isAdmin: true,
					isLate: false,
					needsManualSend: false,
					data: data.checkoutData
				})
			}
		}
	}

	async sendReservationConfirmation(
		data: ReservationConfirmationProps & {
			itemId: string
			reservationData: ReservationEmailData
		}
	): Promise<void> {
		// Only send emails in production
		if (process.env.NODE_ENV !== "production") {
			return
		}

		const html = await render(h(ReservationConfirmation, data))
		const subject = `Reservation Confirmation: ${data.assetName}`

		// Send to user with admins CC'd, or send to admins if no user email
		if (data.personEmail) {
			// Check if user emails are disabled
			if (process.env.DISABLE_EMAILS === "true") {
				return
			}
			await this.sendEmail(
				data.personEmail,
				subject,
				html,
				{
					itemType: "reservation",
					itemId: data.itemId,
					isAdmin: false,
					isLate: false,
					needsManualSend: false,
					data: data.reservationData
				},
				this.config.adminEmails
			)
		} else {
			// No user email, send to admins only
			for (const adminEmail of this.config.adminEmails) {
				await this.sendEmail(adminEmail, `[Admin] ${subject}`, html, {
					itemType: "reservation",
					itemId: data.itemId,
					isAdmin: true,
					isLate: false,
					needsManualSend: false,
					data: data.reservationData
				})
			}
		}
	}

	async sendRepairNotification(
		data: RepairNotificationProps & {
			itemId: string
			repairData: RepairEmailData
		}
	): Promise<void> {
		// Only send emails in production
		if (process.env.NODE_ENV !== "production") {
			return
		}

		const html = await render(h(RepairNotification, data))
		const subject = `Repair Notification: ${data.assetName}`

		// Send to all admins only
		for (const adminEmail of this.config.adminEmails) {
			await this.sendEmail(adminEmail, subject, html, {
				itemType: "repair",
				itemId: data.itemId,
				isAdmin: true,
				isLate: false,
				needsManualSend: false,
				data: data.repairData
			})
		}
	}

	async sendCheckInNotification(
		data: CheckInNotificationProps & {
			itemId: string
			checkInData: CheckInEmailData
		}
	): Promise<void> {
		// Only send emails in production
		if (process.env.NODE_ENV !== "production") {
			return
		}

		const html = await render(h(CheckInNotification, data))
		const subject = `Check-In: ${data.assetName}`

		// Send to all admins only
		for (const adminEmail of this.config.adminEmails) {
			await this.sendEmail(adminEmail, subject, html, {
				itemType: "checkin",
				itemId: data.itemId,
				isAdmin: true,
				isLate: false,
				needsManualSend: false,
				data: data.checkInData
			})
		}
	}

	async sendLateNotification(
		data: LateNotificationProps & {
			itemId: string
			itemData: CheckoutEmailData | ReservationEmailData
		}
	): Promise<void> {
		// Only send emails in production
		if (process.env.NODE_ENV !== "production") {
			return
		}

		// Render HTML without emailId first
		const htmlWithoutId = await render(h(LateNotification, data))
		const subject = `[LATE] ${data.itemType === "checkout" ? "Checkout" : "Reservation"}: ${data.assetName}`

		// Send to admins only, mark as needs manual send
		for (const adminEmail of this.config.adminEmails) {
			await this.sendEmail(adminEmail, subject, htmlWithoutId, {
				itemType: data.itemType,
				itemId: data.itemId,
				isAdmin: true,
				isLate: true,
				needsManualSend: true,
				data: data.itemData
			})
		}
	}

	async resendEmail(historyId: number): Promise<void> {
		const { eq } = await import("drizzle-orm")

		const [record] = await db
			.select()
			.from(emailHistory)
			.where(eq(emailHistory.id, historyId))
			.limit(1)

		if (!record) {
			throw new Error("Email history record not found")
		}

		const data = record.data as EmailData

		// Determine which template to use based on item type
		let html: string
		let subject: string

		if (record.itemType === "checkout" && "checkoutDate" in data) {
			const checkoutData = data as CheckoutEmailData
			html = await render(h(CheckoutConfirmation, checkoutData))
			subject = `Checkout Confirmation: ${checkoutData.assetName}`
		} else if (record.itemType === "reservation" && "startDate" in data) {
			const reservationData = data as ReservationEmailData
			html = await render(h(ReservationConfirmation, reservationData))
			subject = `Reservation Confirmation: ${reservationData.assetName}`
		} else if (record.itemType === "repair") {
			const repairData = data as RepairEmailData
			html = await render(h(RepairNotification, repairData))
			subject = `Repair Notification: ${repairData.assetName}`
		} else {
			throw new Error(`Unknown item type: ${record.itemType}`)
		}

		await this.sendEmail(record.recipient, subject, html, {
			itemType: record.itemType,
			itemId: record.itemId,
			isAdmin: record.isAdmin,
			isLate: record.isLate,
			needsManualSend: false,
			data: record.data
		})
	}
}
