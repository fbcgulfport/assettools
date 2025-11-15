"use client"

import { useCallback, useEffect, useState } from "react"

type Asset = {
	id: string
	description: string
	tag: string
	category?: { value: string }
	checkout?: {
		id: string
		value: {
			person?: { value: { name: string } }
			location?: { value: { name: string } }
			date: string
			dueDate?: string
		}
	}
	reservation?: {
		value: { person?: { value: { name: string } } }
	}
	repair?: {
		id: string
		value: { description: string }
	}
	archived: boolean
}

export function AssetsTab() {
	const [assets, setAssets] = useState<Asset[]>([])
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState("")
	const [currentPage, setCurrentPage] = useState(0)
	const pageSize = 50

	const loadAssets = useCallback(async (page: number) => {
		setLoading(true)
		try {
			const offset = page * pageSize
			const response = await fetch(
				`/api/assets?limit=${pageSize}&offset=${offset}`
			)
			const data = await response.json()
			setAssets(data.data || [])
			setCurrentPage(page)
		} catch (error) {
			setMessage(
				`Error: ${error instanceof Error ? error.message : "Failed to load assets"}`
			)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadAssets(0)
	}, [loadAssets])

	const sendEmail = async (assetId: string, emailType: string) => {
		if (
			!confirm(
				`Are you sure you want to send a ${emailType} email for this asset?`
			)
		)
			return

		try {
			const response = await fetch("/api/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ assetId, emailType })
			})
			const result = await response.json()

			if (result.error) {
				setMessage(`Error: ${result.error}`)
			} else {
				setMessage("Email sent successfully!")
			}
		} catch (error) {
			setMessage(
				`Error: ${error instanceof Error ? error.message : "Failed to send email"}`
			)
		}

		setTimeout(() => setMessage(""), 5000)
	}

	return (
		<div>
			<h2 className="text-2xl font-bold mb-4">All Assets</h2>

			{message && (
				<div
					className={`p-4 rounded mb-5 ${message.startsWith("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
				>
					{message}
				</div>
			)}

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="w-full border-collapse">
					<thead className="bg-gray-50">
						<tr>
							{[
								"Description",
								"Asset Tag",
								"Category",
								"Status",
								"Checked Out To",
								"Actions"
							].map((header) => (
								<th
									key={header}
									className="text-left p-4 font-semibold text-gray-900 border-b-2 border-gray-200"
								>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={6} className="text-center p-10 text-gray-600">
									Loading...
								</td>
							</tr>
						) : assets.length === 0 ? (
							<tr>
								<td colSpan={6} className="text-center p-10 text-gray-600">
									No assets found
								</td>
							</tr>
						) : (
							assets.map((asset) => {
								const description = asset.description || "-"
								const assetTag = asset.tag || "-"
								const category = asset.category?.value || "-"

								let statusBadge = ""
								let checkedOutTo = "-"

								if (asset.checkout) {
									statusBadge = "checkout"
									const parts = []
									if (asset.checkout.value.person?.value.name)
										parts.push(asset.checkout.value.person.value.name)
									if (asset.checkout.value.location?.value.name)
										parts.push(asset.checkout.value.location.value.name)
									checkedOutTo =
										parts.length > 0 ? parts.join(" @ ") : "Unknown"
								} else if (asset.reservation) {
									statusBadge = "reservation"
									checkedOutTo =
										asset.reservation.value.person?.value.name || "Reserved"
								} else if (asset.repair) {
									statusBadge = "repair"
									checkedOutTo = asset.repair.value.description || "In Repair"
								} else {
									statusBadge = "available"
								}

								const hasPerson = asset.checkout?.value.person
								const isPastDue =
									asset.checkout?.value.dueDate &&
									new Date(asset.checkout.value.dueDate) < new Date()

								return (
									<tr
										key={asset.id}
										className="hover:bg-gray-50 border-b border-gray-200"
									>
										<td className="p-4">{description}</td>
										<td className="p-4">{assetTag}</td>
										<td className="p-4">{category}</td>
										<td className="p-4">
											<span
												className={`px-2 py-1 rounded text-xs font-medium ${
													statusBadge === "checkout"
														? "bg-blue-100 text-blue-800"
														: statusBadge === "reservation"
															? "bg-purple-100 text-purple-800"
															: statusBadge === "repair"
																? "bg-red-100 text-red-800"
																: "bg-green-100 text-green-800"
												}`}
											>
												{statusBadge === "checkout"
													? "Checked Out"
													: statusBadge === "reservation"
														? "Reserved"
														: statusBadge === "repair"
															? "Needs Repair"
															: "Available"}
											</span>
										</td>
										<td className="p-4">{checkedOutTo}</td>
										<td className="p-4">
											<div className="flex gap-1 flex-wrap">
												{hasPerson && (
													<button
														type="button"
														onClick={() => sendEmail(asset.id, "checkout")}
														className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
													>
														Checkout Email
													</button>
												)}
												{isPastDue && (
													<button
														type="button"
														onClick={() => sendEmail(asset.id, "late")}
														className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
													>
														Late Notice
													</button>
												)}
												{asset.repair && (
													<button
														type="button"
														onClick={() => sendEmail(asset.id, "repair")}
														className="px-2 py-1 text-xs bg-yellow-500 text-black rounded hover:bg-yellow-600"
													>
														Repair Notice
													</button>
												)}
												{!hasPerson && !asset.repair && "-"}
											</div>
										</td>
									</tr>
								)
							})
						)}
					</tbody>
				</table>
			</div>

			<div className="flex justify-center items-center gap-4 mt-5 p-4">
				<button
					type="button"
					onClick={() => loadAssets(currentPage - 1)}
					disabled={currentPage === 0}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
				>
					Previous
				</button>
				<span className="text-gray-700">Page {currentPage + 1}</span>
				<button
					type="button"
					onClick={() => loadAssets(currentPage + 1)}
					disabled={assets.length < pageSize}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
				>
					Next
				</button>
				<button
					type="button"
					onClick={() => loadAssets(0)}
					className="ml-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Load Assets
				</button>
			</div>
		</div>
	)
}
