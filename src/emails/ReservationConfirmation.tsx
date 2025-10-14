import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

export interface ReservationConfirmationProps {
	assetName: string
	personName: string
	personEmail?: string
	startDate: string
	endDate: string
	notes?: string
}

export default function ReservationConfirmation({
	assetName,
	personName,
	startDate,
	endDate,
	notes
}: ReservationConfirmationProps) {
	return (
		<BaseLayout
			title="Reservation Confirmation"
			previewText={`${personName} reserved ${assetName}`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				{personName},
			</Text>
			<Text className="text-base font-light text-text leading-relaxed">
				Reservation confirmed for <strong>{assetName}</strong>.
			</Text>

			<Section className="bg-gray-50 border border-gray-200 p-5 my-5">
				<table className="w-full">
					<tbody>
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
				Asset available for pickup on the start date. Contact your administrator
				to modify this reservation.
			</Text>
		</BaseLayout>
	)
}

ReservationConfirmation.PreviewProps = {
	assetName: "Sony A7 IV",
	personName: "Jane Doe",
	personEmail: "jane.doe@example.com",
	startDate: "February 1, 2025",
	endDate: "February 5, 2025",
	notes: "Need this for a corporate event shoot."
} as ReservationConfirmationProps
