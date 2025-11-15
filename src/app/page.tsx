"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn, useSession } from "~/lib/auth-client"

export default function HomePage() {
	const { data: session, isPending } = useSession()
	const router = useRouter()

	useEffect(() => {
		if (session) {
			router.push("/admin")
		}
	}, [session, router])

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-gray-600">Loading...</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
				<div>
					<h2 className="text-3xl font-bold text-center text-gray-900">
						AssetTools
					</h2>
					<p className="mt-2 text-center text-gray-600">
						Asset management email notifications
					</p>
				</div>
				<button
					type="button"
					onClick={() => signIn.social({ provider: "google" })}
					className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Sign in with Google
				</button>
			</div>
		</div>
	)
}
