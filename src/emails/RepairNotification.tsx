import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

export interface RepairNotificationProps {
	assetName: string
	status?: string
	description?: string
	dueDate?: string
	repairDate?: string
}

export default function RepairNotification({
	assetName,
	status,
	description,
	dueDate,
	repairDate
}: RepairNotificationProps) {
	return (
		<BaseLayout
			title="Repair Notification"
			previewText={`Repair created for ${assetName}`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				Repair created for asset. Review required.
			</Text>

			<Section className="bg-red-50 border border-red-200 p-5 my-5">
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
						{status && (
							<tr>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										Status:
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{status}
									</Text>
								</td>
							</tr>
						)}
						{repairDate && (
							<tr>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										Repair Date:
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{repairDate}
									</Text>
								</td>
							</tr>
						)}
						{dueDate && (
							<tr>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										Due Date:
									</Text>
								</td>
								<td className="py-2 align-top">
									<Text className="text-sm font-light text-text m-0">
										{dueDate}
									</Text>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</Section>

			{description && (
				<>
					<Text className="text-sm font-semibold text-gray-600 m-0">
						Description:
					</Text>
					<Text className="text-sm font-light text-text leading-snug bg-red-50 p-3 border border-red-200 my-2 mb-4">
						{description}
					</Text>
				</>
			)}

			<Text className="text-base font-light text-text leading-relaxed">
				Review this repair request and take action.
			</Text>
		</BaseLayout>
	)
}

RepairNotification.PreviewProps = {
	assetName: "MacBook Pro 16-inch",
	status: "Pending Review",
	description: "Keyboard keys are sticking and trackpad is unresponsive.",
	dueDate: "January 20, 2025",
	repairDate: "January 18, 2025"
} as RepairNotificationProps
