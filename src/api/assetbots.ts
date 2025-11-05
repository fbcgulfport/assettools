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
	category?: {
		id: string
		type: string
		value: string // Category is just a string, not an object
	}
	checkout?: Checkout
	repair?: Repair
	description?: string
	tag?: string
	labels?: Label[]
	archived?: boolean
	createDate?: string
	updateDate?: string
}

export interface CheckoutValue {
	date: string
	dueDate?: string
	location?: {
		id: string
		type: string
		value: Location
	}
	person?: {
		id: string
		type: string
		value: Person
	}
	status: string
}

export interface Checkout {
	id: string
	type: string
	value: CheckoutValue
}

// Direct checkout API response (different structure than embedded in assets)
export interface CheckoutDetails {
	id: string
	type: string
	status: string
	date: string
	dueDate?: string
	person?: {
		id: string
		type: string
		value: Person
	}
	location?: {
		id: string
		type: string
		value: Location
	}
	assets?: Array<{
		id: string
		type: string
		value: {
			description?: string
			tag?: string
		}
	}>
	createDate?: string
	updateDate?: string
}

export interface RepairValue {
	assigned?: {
		id: string
		type: string
		value: Person
	}
	dueDate?: string
	description?: string
	status: string
	repairDate?: string
}

export interface Repair {
	id: string
	type: string
	value: RepairValue
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

	async getCheckout(id: string): Promise<CheckoutDetails | null> {
		const response = await this.request<{ data: CheckoutDetails[] }>(
			`/checkouts/${id}`
		)
		return response.data[0] || null
	}

	async getRepair(id: string): Promise<{ data: Repair }> {
		return this.request<{ data: Repair }>(`/repairs/${id}`)
	}

	// Fetch all assets
	async getAllAssets(): Promise<Asset[]> {
		// Fetch assets in batches
		const limit = 1000 // Max allowed
		let offset = 0
		const allAssets: Asset[] = []

		// Fetch up to 5000 assets (5 pages)
		for (let page = 0; page < 5; page++) {
			const assets = await this.getAssets({ limit, offset })

			if (assets.data.length === 0) break

			// Filter out archived assets only
			const activeAssets = assets.data.filter((asset) => !asset.archived)

			allAssets.push(...activeAssets)

			// If we got fewer than the limit, we've reached the end
			if (assets.data.length < limit) break

			offset += limit
		}

		return allAssets
	}
}
