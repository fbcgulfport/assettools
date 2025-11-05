import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

export interface CheckInNotificationProps {
	assetName: string
	personName: string
	checkoutDate: string
	checkInDate: string
	category?: string
	daysOut?: number
}

export default function CheckInNotification({
	assetName,
	personName,
	checkoutDate,
	checkInDate,
	category,
	daysOut
}: CheckInNotificationProps) {
	return (
		<BaseLayout
			title="Asset Checked In"
			previewText={`${assetName} has been checked back in`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				<strong>{assetName}</strong> has been checked back in.
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
						{category && (
							<tr>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										Category:
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{category}
									</Text>
								</td>
							</tr>
						)}
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
	assetName: "Canon EOS R5",
	personName: "John Smith",
	checkoutDate: "January 15, 2025",
	checkInDate: "January 18, 2025",
	category: "Cameras",
	daysOut: 3
} as CheckInNotificationProps
