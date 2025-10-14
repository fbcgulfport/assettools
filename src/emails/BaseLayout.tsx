import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text
} from "@react-email/components"
import type React from "react"

export interface BaseLayoutProps {
	title: string
	previewText?: string
	children: React.ReactNode
}

export default function BaseLayout({
	title,
	previewText,
	children
}: BaseLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{previewText || title}</Preview>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								background: "#f6f9fc",
								container: "#ffffff",
								border: "#f0f0f0",
								text: "#404040",
								muted: "#8898aa"
							},
							fontFamily: {
								sans: [
									"-apple-system",
									"BlinkMacSystemFont",
									"Segoe UI",
									"Roboto",
									"Helvetica",
									"Arial",
									"sans-serif"
								]
							}
						}
					}
				}}
			>
				<Body className="bg-background py-2.5 font-sans">
					<Container className="bg-container border border-border p-11">
						<Heading className="text-2xl font-light text-text mb-7">
							{title}
						</Heading>
						<Section>{children}</Section>
						<Hr className="border-gray-200 my-6" />
						<Text className="text-sm font-light text-muted leading-6">
							This is an automated message. If you have any questions, please
							contact your administrator by replying to this email.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}
