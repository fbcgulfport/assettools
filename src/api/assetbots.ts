export interface AssetBotsConfig {
	apiKey: string
	apiUrl: string
}

export interface Category {
	id: string
	name: string
}

export interface Label {
	id: string
	name: string
}

export interface Asset {
	id: string
	category?: Category
	checkout?: Checkout
	repair?: Repair
	description?: string
	tag?: string
	labels?: Label[]
	archived?: boolean
	createDate?: string
	updateDate?: string
}

export interface Checkout {
	id: string
	assets?: Asset[]
	date: string
	dueDate?: string
	location?: Location
	person?: Person
	status: string
}

export interface Repair {
	id: string
	assets?: Asset[]
	assigned?: Person
	dueDate?: string
	description?: string
	status: string
	repairDate?: string
}

export interface Person {
	id: string
	name: string
	labels?: Label[]
	archived?: boolean
	createDate?: string
	updateDate?: string
}

export interface Address {
	street1?: string
	street2?: string
	city?: string
	state?: string
	zip?: string
	country?: string
}

export interface Location {
	id: string
	name: string
	address?: Address
	labels?: Label[]
	archived?: boolean
	createDate?: string
	updateDate?: string
}

// Helper function to get a display name for an asset
export function getAssetName(asset: Asset): string {
	return asset.tag || asset.description || asset.id
}

export class AssetBotsClient {
	private config: AssetBotsConfig
	private lastRequestTime = 0
	private minRequestInterval = 1000 // 1 second between requests to be safe

	constructor(config: AssetBotsConfig) {
		this.config = config
	}

	private async rateLimit() {
		const now = Date.now()
		const timeSinceLastRequest = now - this.lastRequestTime
		if (timeSinceLastRequest < this.minRequestInterval) {
			await new Promise((resolve) =>
				setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
			)
		}
		this.lastRequestTime = Date.now()
	}

	private async request<T>(
		endpoint: string,
		options?: RequestInit
	): Promise<T> {
		await this.rateLimit()

		const url = `${this.config.apiUrl}${endpoint}`
		const response = await fetch(url, {
			...options,
			headers: {
				"X-Api-Key": this.config.apiKey,
				"Content-Type": "application/json",
				...options?.headers
			}
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(
				`AssetBots API error: ${response.status} ${response.statusText} - ${errorText}`
			)
		}

		return response.json() as Promise<T>
	}

	async getAssets(params?: {
		limit?: number
		offset?: number
		$filter?: string
	}): Promise<{ data: Asset[] }> {
		const queryParams = new URLSearchParams()
		if (params?.limit) queryParams.set("limit", params.limit.toString())
		if (params?.offset) queryParams.set("offset", params.offset.toString())
		if (params?.$filter) queryParams.set("$filter", params.$filter)

		const query = queryParams.toString()
		const endpoint = `/assets${query ? `?${query}` : ""}`

		return this.request<{ data: Asset[] }>(endpoint)
	}

	async getCheckout(id: string): Promise<{ data: Checkout }> {
		return this.request<{ data: Checkout }>(`/checkouts/${id}`)
	}

	async getRepair(id: string): Promise<{ data: Repair }> {
		return this.request<{ data: Repair }>(`/repairs/${id}`)
	}

	// Fetch recent assets with checkouts or repairs
	// Since the API doesn't have list endpoints for checkouts/repairs,
	// we need to fetch assets and check for recent changes
	async getRecentAssets(sinceDate: Date): Promise<Asset[]> {
		// Fetch assets in batches, looking for recent updates
		const limit = 1000 // Max allowed
		let offset = 0
		const allAssets: Asset[] = []
		const sinceTimestamp = sinceDate.toISOString()

		// We'll fetch up to 5000 assets (5 pages) to find recent changes
		// This is a limitation of the API - in production you might want to adjust this
		for (let page = 0; page < 5; page++) {
			const assets = await this.getAssets({ limit, offset })

			if (assets.data.length === 0) break

			// Filter for assets with recent checkouts or repairs
			// Note: We use updateDate since checkout/repair don't have their own timestamps
			const recentAssets = assets.data.filter((asset) => {
				if (!asset.updateDate) return false
				return (
					asset.updateDate >= sinceTimestamp && (asset.checkout || asset.repair)
				)
			})

			allAssets.push(...recentAssets)

			// If we got fewer than the limit, we've reached the end
			if (assets.data.length < limit) break

			offset += limit
		}

		return allAssets
	}
}
