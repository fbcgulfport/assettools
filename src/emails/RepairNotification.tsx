import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

type AssetItem = {
	description: string
	tag?: string
	category?: string
}

export interface RepairNotificationProps {
	assets: AssetItem[]
	status?: string
	description?: string
	dueDate?: string
	repairDate?: string
}

export default function RepairNotification({
	assets,
	status,
	description,
	dueDate,
	repairDate
}: RepairNotificationProps) {
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
			title="Repair Notification"
			previewText={`Repair created for ${assetsList}`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				Repair created for the following{" "}
				{assets.length === 1 ? "asset" : "assets"}. Review required.
			</Text>

			<Section className="bg-red-50 border border-red-200 p-5 my-5">
				<table className="w-full">
					<tbody>
						{assets.map((asset, index) => (
							<tr key={asset.tag || asset.description}>
								<td className="py-2 pr-4 align-top w-[35%]">
									<Text className="text-sm font-semibold text-gray-600 m-0">
										{assets.length === 1 ? "Asset:" : `Asset ${index + 1}:`}
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
						{(status || repairDate || dueDate) && (
							<tr>
								<td colSpan={2} className="py-2 border-t border-gray-300" />
							</tr>
						)}
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
	assets: [
		{
			description: "MacBook Pro 16-inch",
			tag: "LAPTOP-123",
			category: "Laptops"
		}
	],
	status: "Pending Review",
	description: "Keyboard keys are sticking and trackpad is unresponsive.",
	dueDate: "January 20, 2025",
	repairDate: "January 18, 2025"
} as RepairNotificationProps
