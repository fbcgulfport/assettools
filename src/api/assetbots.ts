export interface AssetBotsConfig {
  apiKey: string;
  apiUrl: string;
}

export interface Asset {
  id: string;
  name: string;
  serialNumber?: string;
  checkout?: Checkout;
  reservation?: Reservation;
  repair?: Repair;
  createdDate?: string;
  updatedDate?: string;
}

export interface Checkout {
  id: string;
  assetId: string;
  personId?: string;
  locationId?: string;
  person?: Person;
  location?: Location;
  date: string;
  dueDate?: string;
  notes?: string;
  createdDate?: string;
}

export interface Reservation {
  id: string;
  assetId: string;
  personId?: string;
  person?: Person;
  startDate: string;
  endDate: string;
  notes?: string;
  createdDate?: string;
}

export interface Repair {
  id: string;
  assetId: string;
  assignedId?: string;
  status?: string;
  description?: string;
  dueDate?: string;
  repairDate?: string;
  createdDate?: string;
}

export interface Person {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
}

export interface Location {
  id: string;
  name?: string;
}

export class AssetBotsClient {
  private config: AssetBotsConfig;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // 1 second between requests to be safe

  constructor(config: AssetBotsConfig) {
    this.config = config;
  }

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.rateLimit();

    const url = `${this.config.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AssetBots API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getAssets(params?: {
    limit?: number;
    offset?: number;
    $filter?: string;
  }): Promise<Asset[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.$filter) queryParams.set('$filter', params.$filter);

    const query = queryParams.toString();
    const endpoint = `/assets${query ? `?${query}` : ''}`;

    return this.request<Asset[]>(endpoint);
  }

  async getCheckout(id: string): Promise<Checkout> {
    return this.request<Checkout>(`/checkouts/${id}`);
  }

  async getRepair(id: string): Promise<Repair> {
    return this.request<Repair>(`/repairs/${id}`);
  }

  // Fetch recent assets with checkouts, repairs, or reservations
  // Since the API doesn't have list endpoints for checkouts/repairs/reservations,
  // we need to fetch assets and check for recent changes
  async getRecentAssets(sinceDate: Date): Promise<Asset[]> {
    // Fetch assets in batches, looking for recent updates
    const limit = 1000; // Max allowed
    let offset = 0;
    const allAssets: Asset[] = [];
    const sinceTimestamp = sinceDate.toISOString();

    // We'll fetch up to 5000 assets (5 pages) to find recent changes
    // This is a limitation of the API - in production you might want to adjust this
    for (let page = 0; page < 5; page++) {
      const assets = await this.getAssets({ limit, offset });

      if (assets.length === 0) break;

      // Filter for assets with recent checkouts, repairs, or reservations
      const recentAssets = assets.filter(asset => {
        const checkoutRecent = asset.checkout?.createdDate &&
          asset.checkout.createdDate >= sinceTimestamp;
        const repairRecent = asset.repair?.createdDate &&
          asset.repair.createdDate >= sinceTimestamp;
        const reservationRecent = asset.reservation?.createdDate &&
          asset.reservation.createdDate >= sinceTimestamp;

        return checkoutRecent || repairRecent || reservationRecent;
      });

      allAssets.push(...recentAssets);

      // If we got fewer than the limit, we've reached the end
      if (assets.length < limit) break;

      offset += limit;
    }

    return allAssets;
  }
}
