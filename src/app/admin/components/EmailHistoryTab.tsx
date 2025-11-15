"use client"

import { useCallback, useEffect, useState } from "react"

type EmailHistory = {
	id: number
	itemType: string
	itemId: string
	recipient: string
	subject: string
	sentAt: string
	status: string
	errorMessage: string | null
	isAdmin: boolean
	isLate: boolean
	needsManualSend: boolean
	data: unknown
}

export function EmailHistoryTab() {
	const [emails, setEmails] = useState<EmailHistory[]>([])
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState("")

	const loadEmails = useCallback(async () => {
		try {
			const response = await fetch("/api/emails")
			const data = await response.json()
			setEmails(data)
		} catch (error) {
			setMessage(
				`Error: ${error instanceof Error ? error.message : "Failed to load emails"}`
			)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadEmails()
		const interval = setInterval(loadEmails, 30000)
		return () => clearInterval(interval)
	}, [loadEmails])

	const resendEmail = async (id: number) => {
		if (!confirm("Are you sure you want to resend this email?")) return

		try {
			const response = await fetch("/api/resend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id })
			})
			const result = await response.json()

			if (result.error) {
				setMessage(`Error: ${result.error}`)
			} else {
				setMessage("Email resent successfully!")
				setTimeout(() => loadEmails(), 1000)
			}
		} catch (error) {
			setMessage(
				`Error: ${error instanceof Error ? error.message : "Failed to resend"}`
			)
		}

		setTimeout(() => setMessage(""), 5000)
	}

	const total = emails.length
	const sent = emails.filter((e) => e.status === "sent").length
	const skipped = emails.filter((e) => e.status === "skipped").length
	const failed = emails.filter((e) => e.status === "failed").length

	return (
		<div>
			<h2 className="text-2xl font-bold mb-4">Email History</h2>

			<div className="grid grid-cols-4 gap-4 mb-8">
				{[
					{ label: "Total Emails", value: total },
					{ label: "Sent Successfully", value: sent },
					{ label: "Skipped", value: skipped },
					{ label: "Failed", value: failed }
				].map((stat) => (
					<div key={stat.label} className="bg-white p-5 rounded-lg shadow">
						<h3 className="text-sm font-medium text-gray-600 mb-2">
							{stat.label}
						</h3>
						<div className="text-3xl font-bold text-gray-900">{stat.value}</div>
					</div>
				))}
			</div>

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
								"Date",
								"Type",
								"Recipient",
								"Subject",
								"Status",
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
						) : emails.length === 0 ? (
							<tr>
								<td colSpan={6} className="text-center p-10 text-gray-600">
									No emails found
								</td>
							</tr>
						) : (
							emails.map((email) => {
								const showResend =
									email.status === "failed" ||
									email.status === "skipped" ||
									email.needsManualSend

								return (
									<tr
										key={email.id}
										className="hover:bg-gray-50 border-b border-gray-200"
									>
										<td className="p-4">
											{new Date(email.sentAt).toLocaleString()}
										</td>
										<td className="p-4">
											<div className="flex gap-1 flex-wrap">
												<span
													className={`px-2 py-1 rounded text-xs font-medium ${
														email.itemType === "checkout"
															? "bg-blue-100 text-blue-800"
															: email.itemType === "reservation"
																? "bg-purple-100 text-purple-800"
																: email.itemType === "repair"
																	? "bg-red-100 text-red-800"
																	: "bg-cyan-100 text-cyan-800"
													}`}
												>
													{email.itemType}
												</span>
												<span
													className={`px-2 py-1 rounded text-xs font-medium ${
														email.status === "sent"
															? "bg-green-100 text-green-800"
															: email.status === "failed"
																? "bg-red-100 text-red-800"
																: "bg-gray-100 text-gray-800"
													}`}
												>
													{email.status}
												</span>
												{email.isAdmin && (
													<span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
														Admin
													</span>
												)}
												{email.isLate && (
													<span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
														Late
													</span>
												)}
											</div>
										</td>
										<td className="p-4">{email.recipient}</td>
										<td className="p-4">{email.subject}</td>
										<td className="p-4">
											{email.status === "sent" && (
												<span className="text-green-600">✓ Sent</span>
											)}
											{email.status === "failed" && (
												<span
													className="text-red-600"
													title={email.errorMessage || "Unknown error"}
												>
													✗ Failed
												</span>
											)}
											{email.status === "skipped" && (
												<span
													className="text-gray-600"
													title={email.errorMessage || "Skipped"}
												>
													⊘ Skipped
												</span>
											)}
										</td>
										<td className="p-4">
											{showResend ? (
												<button
													type="button"
													onClick={() => resendEmail(email.id)}
													className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
												>
													Send Now
												</button>
											) : (
												"-"
											)}
										</td>
									</tr>
								)
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
