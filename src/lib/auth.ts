import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite"
	}),
	emailAndPassword: {
		enabled: false
	},
	socialProviders: {
		google: {
			clientId: process.env.GMAIL_CLIENT_ID!,
			clientSecret: process.env.GMAIL_CLIENT_SECRET!
		}
	},
	trustedOrigins: [process.env.WEB_URL!]
})

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
