import { Button, Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

type AssetItem = {
	description: string
	tag?: string
	category?: string
}

export interface LateNotificationProps {
	itemType: "checkout" | "reservation"
	assets: AssetItem[]
	personName: string
	personEmail?: string
	date: string
	hoursLate: number
	emailId?: number
	returnTo?: string
}

export default function LateNotification({
	itemType,
	assets,
	personName,
	personEmail,
	date,
	hoursLate,
	emailId,
	returnTo
}: LateNotificationProps) {
	const itemTypeLabel = itemType === "checkout" ? "Checkout" : "Reservation"
	const _assetsList =
		assets.length === 1
			? assets[0]!.description
			: assets.length === 2
				? `${assets[0]!.description} and ${assets[1]!.description}`
				: `${assets
						.slice(0, -1)
						.map((a) => a.description)
						.join(", ")}, and ${assets[assets.length - 1]!.description}`

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
						{assets.map((asset, index) => (
							<tr key={asset.tag || asset.description}>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										{assets.length === 1 ? "Item:" : `Item ${index + 1}:`}
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{asset.description}
										{asset.tag && (
											<span className="text-gray-500"> ({asset.tag})</span>
										)}
									</Text>
									{asset.category && (
										<Text className="text-xs text-gray-500 m-0 mt-1">
											{asset.category}
										</Text>
									)}
								</td>
							</tr>
						))}
						{returnTo && (
							<tr>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										Return To:
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{returnTo}
									</Text>
								</td>
							</tr>
						)}
						<tr>
							<td colSpan={2} className="py-2 border-t border-gray-300" />
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
				{emailId ? (
					<>
						<Button
							href={`${process.env.WEB_URL}/api/resend?id=${emailId}`}
							className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline text-center"
						>
							Send Confirmation Email to User
						</Button>
						<br />
						<br />
					</>
				) : null}
				This notification is for administrative purposes only.
			</Text>
		</BaseLayout>
	)
}

LateNotification.PreviewProps = {
	itemType: "checkout",
	assets: [
		{
			description: "Canon EOS R5 Camera",
			tag: "CAM-001",
			category: "Cameras"
		}
	],
	personName: "John Smith",
	personEmail: "john.smith@example.com",
	date: "January 15, 2025",
	hoursLate: 6,
	returnTo: "Media Office"
} as LateNotificationProps
