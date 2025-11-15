import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

type AssetItem = {
	description: string
	tag?: string
	category?: string
}

export interface CheckoutConfirmationProps {
	assets: AssetItem[]
	personName: string
	personEmail?: string
	checkoutDate: string
	dueDate?: string
	notes?: string
	returnTo?: string
}

export default function CheckoutConfirmation({
	assets,
	personName,
	checkoutDate,
	dueDate,
	notes,
	returnTo
}: CheckoutConfirmationProps) {
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
			title="Checkout Confirmation"
			previewText={`${personName} checked out ${assetsList}`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				{personName},
			</Text>
			<Text className="text-base font-light text-text leading-relaxed">
				You have checked out the following{" "}
				{assets.length === 1 ? "item" : "items"}:
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
									Checked Out:
								</Text>
							</td>
							<td className="py-2 align-top">
								<Text className="text-sm font-light text-text m-0">
									{checkoutDate}
								</Text>
							</td>
						</tr>
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
				{dueDate
					? `Please return ${assets.length === 1 ? "this item" : "these items"} by the due date. `
					: ""}
				If you have any questions, please let us know.
			</Text>
		</BaseLayout>
	)
}

CheckoutConfirmation.PreviewProps = {
	assets: [
		{
			description: "Canon EOS R5 Camera",
			tag: "CAM-001",
			category: "Cameras"
		},
		{
			description: "RF 24-70mm f/2.8 Lens",
			tag: "LENS-042",
			category: "Lenses"
		}
	],
	personName: "John Smith",
	personEmail: "john.smith@example.com",
	checkoutDate: "January 15, 2025",
	dueDate: "January 22, 2025",
	notes: "Please handle with care and return fully charged.",
	returnTo: "Media Office"
} as CheckoutConfirmationProps
