import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

type AssetItem = {
	description: string
	tag?: string
	category?: string
}

export interface ReservationConfirmationProps {
	assets: AssetItem[]
	personName: string
	personEmail?: string
	startDate: string
	endDate: string
	notes?: string
}

export default function ReservationConfirmation({
	assets,
	personName,
	startDate,
	endDate,
	notes
}: ReservationConfirmationProps) {
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
			title="Reservation Confirmation"
			previewText={`${personName} reserved ${assetsList}`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				{personName},
			</Text>
			<Text className="text-base font-light text-text leading-relaxed">
				You have reserved the following {assets.length === 1 ? "item" : "items"}
				:
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
									Start Date:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{startDate}
								</Text>
							</td>
						</tr>
						<tr>
							<td className="py-2 pr-4 align-top w-[35%]">
								<Text className="text-sm font-semibold text-gray-600 m-0">
									End Date:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{endDate}
								</Text>
							</td>
						</tr>
					</tbody>
				</table>
			</Section>

			{notes && (
				<>
					<Text className="text-sm font-semibold text-gray-600 m-0">
						Notes:
					</Text>
					<Text className="text-sm font-light text-text leading-snug bg-gray-50 p-3 border border-gray-200 my-2 mb-4">
						{notes}
					</Text>
				</>
			)}

			<Text className="text-base font-light text-text leading-relaxed">
				{assets.length === 1 ? "This item is" : "These items are"} available for
				pickup on the start date. Contact your administrator to modify this
				reservation.
			</Text>
		</BaseLayout>
	)
}

ReservationConfirmation.PreviewProps = {
	assets: [
		{
			description: "Sony A7 IV Camera",
			tag: "CAM-042",
			category: "Cameras"
		}
	],
	personName: "Jane Doe",
	personEmail: "jane.doe@example.com",
	startDate: "February 1, 2025",
	endDate: "February 5, 2025",
	notes: "Need this for a corporate event shoot."
} as ReservationConfirmationProps
