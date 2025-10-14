import { Section, Text } from "@react-email/components"
import BaseLayout from "./BaseLayout"

export interface CheckoutConfirmationProps {
	assetName: string
	personName: string
	personEmail?: string
	checkoutDate: string
	dueDate?: string
	notes?: string
}

export default function CheckoutConfirmation({
	assetName,
	personName,
	checkoutDate,
	dueDate,
	notes
}: CheckoutConfirmationProps) {
	return (
		<BaseLayout
			title="Checkout Confirmation"
			previewText={`${personName} checked out ${assetName}`}
		>
			<Text className="text-base font-light text-text leading-relaxed">
				{personName},
			</Text>
			<Text className="text-base font-light text-text leading-relaxed">
				You have checked out <strong>{assetName}</strong>.
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
				Return the asset by the due date. Contact your administrator with
				questions.
			</Text>
		</BaseLayout>
	)
}

CheckoutConfirmation.PreviewProps = {
	assetName: "Canon EOS R5",
	personName: "John Smith",
	personEmail: "john.smith@example.com",
	checkoutDate: "January 15, 2025",
	dueDate: "January 22, 2025",
	notes: "Please handle with care and return fully charged."
} as CheckoutConfirmationProps
