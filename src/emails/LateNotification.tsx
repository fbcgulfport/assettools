import { Button, Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

export interface LateNotificationProps {
	itemType: "checkout" | "reservation"
	assetName: string
	personName: string
	personEmail?: string
	date: string
	hoursLate: number
	emailId?: number
}

export default function LateNotification({
	itemType,
	assetName,
	personName,
	personEmail,
	date,
	hoursLate,
	emailId
}: LateNotificationProps) {
	const itemTypeLabel = itemType === "checkout" ? "Checkout" : "Reservation"

	return (
		<BaseLayout
			title={`Late ${itemTypeLabel} Detected`}
			previewText={`${itemTypeLabel} was created ${hoursLate} hours ago`}
		>
			<Section className="bg-yellow-50 border border-yellow-300 border-l-4 border-l-yellow-500 p-4 my-5">
				<Text className="text-sm font-normal text-yellow-900 leading-6 m-0">
					This {itemType} was created {hoursLate} hours ago and was just
					detected by the system.
				</Text>
			</Section>

			<Text className="text-base font-light text-text leading-relaxed">
				User confirmation email was not sent automatically. Review details below
				and determine if manual contact is required.
			</Text>

			<Section className="bg-gray-50 border border-gray-200 p-5 my-5">
				<table className="w-full">
					<tbody>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									Type:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{itemTypeLabel}
								</Text>
							</td>
						</tr>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									Asset:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{assetName}
								</Text>
							</td>
						</tr>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									{itemType === "checkout"
										? "Checked Out To:"
										: "Reserved For:"}
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{personName}
								</Text>
							</td>
						</tr>
						{personEmail && (
							<tr>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										Email:
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{personEmail}
									</Text>
								</td>
							</tr>
						)}
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									Date:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">{date}</Text>
							</td>
						</tr>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									Hours Late:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-semibold text-red-600 m-0">
									{hoursLate} hours
								</Text>
							</td>
						</tr>
					</tbody>
				</table>
			</Section>

			<Text className="text-base font-light text-text leading-relaxed">
				Use the button below to resend the confirmation email to the user.
			</Text>

			{emailId && (
				<Section className="text-center my-6">
					<Button
						href={`${process.env.WEB_URL || "http://localhost:3000"}/?resend=${emailId}`}
						className="bg-blue-600 text-white px-6 py-3 rounded font-medium no-underline inline-block"
					>
						Resend Confirmation Email
					</Button>
				</Section>
			)}
		</BaseLayout>
	)
}

LateNotification.PreviewProps = {
	itemType: "checkout",
	assetName: "DJI Mavic 3 Pro",
	personName: "Mike Johnson",
	personEmail: "mike.johnson@example.com",
	date: "January 12, 2025",
	hoursLate: 8,
	emailId: 123
} as LateNotificationProps
