// API client for backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type RouteRecord = {
  routeId: string;
  shipId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  ghgIntensity: number;
  fuelConsumption: number;
  distance?: number;
  totalEmissions?: number;
  isBaseline?: boolean;
};

export type CBResult = {
  shipId: string;
  year: number;
  cb_g: number;
  cb_t: number;
  components: Array<{
    routeId: string;
    ghgIntensity: number;
    fuelTons: number;
    energyMJ: number;
    cb_g: number;
  }>;
  computedAt: string;
  adjusted_g?: number;
  totalBanked?: number;
  totalApplied?: number;
};

export type BankEntry = {
  id: string;
  shipId: string;
  year: number;
  amount_g: number;
  type: "bank" | "apply";
  createdAt: string;
};

export type PoolResult = {
  year: number;
  poolSum: number;
  members: Array<{
    shipId: string;
    cb_before_g: number;
    cb_after_g: number;
  }>;
};

export const api = {
  // Routes
  async getRoutes(filters?: {
    shipId?: string;
    year?: number;
    vesselType?: string;
    fuelType?: string;
  }): Promise<RouteRecord[]> {
    const params = new URLSearchParams();
    if (filters?.shipId) params.set("shipId", filters.shipId);
    if (filters?.year) params.set("year", String(filters.year));
    if (filters?.vesselType) params.set("vesselType", filters.vesselType);
    if (filters?.fuelType) params.set("fuelType", filters.fuelType);
    
    const res = await fetch(`${API_URL}/routes?${params}`);
    if (!res.ok) throw new Error("Failed to fetch routes");
    return res.json();
  },

  async setBaseline(routeId: string): Promise<{ ok: boolean; route: RouteRecord }> {
    const res = await fetch(`${API_URL}/routes/${routeId}/baseline`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to set baseline");
    return res.json();
  },

  async getComparison(year?: number): Promise<{ comparisons: Array<any> }> {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    const res = await fetch(`${API_URL}/routes/comparison?${params}`);
    if (!res.ok) throw new Error("Failed to fetch comparison");
    return res.json();
  },

  // Compliance
  async getCB(shipId: string, year: number): Promise<CBResult> {
    const res = await fetch(`${API_URL}/compliance/cb?shipId=${shipId}&year=${year}`);
    if (!res.ok) throw new Error("Failed to fetch CB");
    return res.json();
  },

  async getAdjustedCB(shipId: string, year: number): Promise<CBResult> {
    const res = await fetch(`${API_URL}/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
    if (!res.ok) throw new Error("Failed to fetch adjusted CB");
    return res.json();
  },

  // Banking
  async getBankingRecords(shipId: string, year: number): Promise<BankEntry[]> {
    const res = await fetch(`${API_URL}/banking/records?shipId=${shipId}&year=${year}`);
    if (!res.ok) throw new Error("Failed to fetch banking records");
    return res.json();
  },

  async bankSurplus(shipId: string, year: number, amount_g: number): Promise<{ ok: boolean; entry: BankEntry }> {
    const res = await fetch(`${API_URL}/banking/bank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipId, year, amount_g }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to bank surplus");
    }
    return res.json();
  },

  async applyBanked(shipId: string, year: number, amount_g: number): Promise<{ ok: boolean; entry: BankEntry }> {
    const res = await fetch(`${API_URL}/banking/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipId, year, amount_g }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to apply banked");
    }
    return res.json();
  },

  // Pools
  async createPool(year: number, members: string[]): Promise<PoolResult> {
    const res = await fetch(`${API_URL}/pools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, members }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create pool");
    }
    return res.json();
  },
};
