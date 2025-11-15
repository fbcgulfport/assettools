"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut, useSession } from "~/lib/auth-client"
import { AssetsTab } from "./components/AssetsTab"
import { EmailHistoryTab } from "./components/EmailHistoryTab"
import { FilterAssetsTab } from "./components/FilterAssetsTab"

export default function AdminPage() {
	const { data: session, isPending } = useSession()
	const router = useRouter()
	const [activeTab, setActiveTab] = useState<
		"email-history" | "assets" | "filter-assets"
	>("assets")

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/")
		}
	}, [session, isPending, router])

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-gray-600">Loading...</div>
			</div>
		)
	}

	if (!session) {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50 p-5">
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-5">
					<h1 className="text-3xl font-bold text-gray-900">Asset Tools</h1>
					<div className="flex items-center gap-4">
						<span className="text-sm text-gray-600">{session.user.email}</span>
						<button
							type="button"
							onClick={() => signOut()}
							className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
						>
							Sign Out
						</button>
					</div>
				</div>

				<div className="flex gap-2 mb-5 border-b-2 border-gray-200">
					<button
						type="button"
						onClick={() => setActiveTab("email-history")}
						className={`px-5 py-2.5 text-base border-b-[3px] -mb-0.5 transition ${
							activeTab === "email-history"
								? "text-blue-600 border-blue-600"
								: "text-gray-600 border-transparent hover:text-gray-900"
						}`}
					>
						Email History
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("assets")}
						className={`px-5 py-2.5 text-base border-b-[3px] -mb-0.5 transition ${
							activeTab === "assets"
								? "text-blue-600 border-blue-600"
								: "text-gray-600 border-transparent hover:text-gray-900"
						}`}
					>
						All Assets
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("filter-assets")}
						className={`px-5 py-2.5 text-base border-b-[3px] -mb-0.5 transition ${
							activeTab === "filter-assets"
								? "text-blue-600 border-blue-600"
								: "text-gray-600 border-transparent hover:text-gray-900"
						}`}
					>
						Filter Assets
					</button>
				</div>

				{activeTab === "email-history" && <EmailHistoryTab />}
				{activeTab === "assets" && <AssetsTab />}
				{activeTab === "filter-assets" && <FilterAssetsTab />}
			</div>
		</div>
	)
}
