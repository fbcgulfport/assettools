import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

type AssetItem = {
	description: string
	tag?: string
	category?: string
}

export interface CheckInNotificationProps {
	assets: AssetItem[]
	personName: string
	checkoutDate: string
	checkInDate: string
	daysOut?: number
}

export default function CheckInNotification({
	assets,
	personName,
	checkoutDate,
	checkInDate,
	daysOut
}: CheckInNotificationProps) {
	const assetsList =
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
			title="Asset Checked In"
			previewText={`${assetsList} ${assets.length === 1 ? "has" : "have"} been checked back in`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				The following {assets.length === 1 ? "item has" : "items have"} been
				checked back in:
			</Text>

			<Section className="bg-gray-50 border border-gray-200 p-5 my-5">
				<table className="w-full">
					<tbody>
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
						<tr>
							<td colSpan={2} className="py-2 border-t border-gray-300" />
						</tr>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									Checked Out By:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{personName}
								</Text>
							</td>
						</tr>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									Checked Out:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{checkoutDate}
								</Text>
							</td>
						</tr>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									Checked In:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{checkInDate}
								</Text>
							</td>
						</tr>
						{daysOut !== undefined && (
							<tr>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										Duration:
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{daysOut} {daysOut === 1 ? "day" : "days"}
									</Text>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</Section>

			<Text className="text-base font-light text-text leading-relaxed">
				This is an automated notification for administrative tracking.
			</Text>
		</BaseLayout>
	)
}

CheckInNotification.PreviewProps = {
	assets: [
		{
			description: "Canon EOS R5 Camera",
			tag: "CAM-001",
			category: "Cameras"
		}
	],
	personName: "John Smith",
	checkoutDate: "January 15, 2025",
	checkInDate: "January 18, 2025",
	daysOut: 3
} as CheckInNotificationProps
