import { render } from "@react-email/render"
import nodemailer from "nodemailer"
import { db, emailHistory, type NewEmailHistory } from "../db"
import {
	CheckoutConfirmationEmail,
	type CheckoutEmailProps,
	LateNotificationEmail,
	type LateNotificationEmailProps,
	type RepairEmailProps,
	RepairNotificationEmail,
	ReservationConfirmationEmail,
	type ReservationEmailProps
} from "../emails/templates"

export interface EmailConfig {
	host: string
	port: number
	secure: boolean
	auth: {
		user: string
		pass: string
	}
	from: {
		email: string
		name: string
	}
	adminEmails: string[]
}

export class EmailService {
	private transporter: nodemailer.Transporter
	private config: EmailConfig

	constructor(config: EmailConfig) {
		this.config = config
		this.transporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: config.auth
		})
	}

	private async sendEmail(
		to: string,
		subject: string,
		html: string,
		metadata: Omit<NewEmailHistory, "sentAt" | "status" | "errorMessage">
	): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: `${this.config.from.name} <${this.config.from.email}>`,
				to,
				subject,
				html
			})

			// Log success
			await db.insert(emailHistory).values({
				...metadata,
				recipient: to,
				subject,
				sentAt: new Date(),
				status: "sent"
			})

			console.log(`✓ Email sent to ${to}: ${subject}`)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)

			// Log failure
			await db.insert(emailHistory).values({
				...metadata,
				recipient: to,
				subject,
				sentAt: new Date(),
				status: "failed",
				errorMessage
			})

			console.error(`✗ Failed to send email to ${to}: ${errorMessage}`)
			throw error
		}
	}

	async sendCheckoutConfirmation(
		data: CheckoutEmailProps & { itemId: string; checkoutData: any }
	): Promise<void> {
		const html = render(CheckoutConfirmationEmail(data))
		const subject = `Checkout Confirmation: ${data.assetName}`

		// Send to user if they have an email
		if (data.personEmail) {
			await this.sendEmail(data.personEmail, subject, html, {
				itemType: "checkout",
				itemId: data.itemId,
				isAdmin: false,
				isLate: false,
				needsManualSend: false,
				data: data.checkoutData
			})
		}

		// Send to all admins
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

	async sendReservationConfirmation(
		data: ReservationEmailProps & { itemId: string; reservationData: any }
	): Promise<void> {
		const html = render(ReservationConfirmationEmail(data))
		const subject = `Reservation Confirmation: ${data.assetName}`

		// Send to user if they have an email
		if (data.personEmail) {
			await this.sendEmail(data.personEmail, subject, html, {
				itemType: "reservation",
				itemId: data.itemId,
				isAdmin: false,
				isLate: false,
				needsManualSend: false,
				data: data.reservationData
			})
		}

		// Send to all admins
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

	async sendRepairNotification(
		data: RepairEmailProps & { itemId: string; repairData: any }
	): Promise<void> {
		const html = render(RepairNotificationEmail(data))
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

	async sendLateNotification(
		data: LateNotificationEmailProps & { itemId: string; itemData: any }
	): Promise<void> {
		const html = render(LateNotificationEmail(data))
		const subject = `[LATE] ${data.itemType === "checkout" ? "Checkout" : "Reservation"}: ${data.assetName}`

		// Send to admins only, mark as needs manual send
		for (const adminEmail of this.config.adminEmails) {
			await this.sendEmail(adminEmail, subject, html, {
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
		const [record] = await db
			.select()
			.from(emailHistory)
			.where((t) => t.id === historyId)
			.limit(1)

		if (!record) {
			throw new Error("Email history record not found")
		}

		const data = record.data as any

		// Determine which template to use based on item type
		let html: string
		let subject: string

		if (record.itemType === "checkout") {
			html = render(CheckoutConfirmationEmail(data))
			subject = `Checkout Confirmation: ${data.assetName}`
		} else if (record.itemType === "reservation") {
			html = render(ReservationConfirmationEmail(data))
			subject = `Reservation Confirmation: ${data.assetName}`
		} else if (record.itemType === "repair") {
			html = render(RepairNotificationEmail(data))
			subject = `Repair Notification: ${data.assetName}`
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
