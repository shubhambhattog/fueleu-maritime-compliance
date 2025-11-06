export type RouteRecord = {
  routeId: string;
  shipId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  ghgIntensity: number; // gCO2e/MJ
  fuelConsumption: number; // tons
  distance?: number;
  totalEmissions?: number;
  isBaseline?: boolean;
};

export type CBComponent = {
  routeId: string;
  ghgIntensity: number;
  fuelTons: number;
  energyMJ: number;
  cb_g: number; // grams
};

export type CBResult = {
  shipId: string;
  year: number;
  cb_g: number;
  cb_t: number;
  components: CBComponent[];
  computedAt: string;
};

const TARGET = 89.3368; // gCO2e/MJ
const MJ_PER_TON = 41000; // MJ/t

export function computeShipCB(routes: RouteRecord[], shipId: string, year: number, target = TARGET): CBResult {
  const filtered = routes.filter((r) => r.shipId === shipId && r.year === year);

  const components: CBComponent[] = filtered.map((r) => {
    const energyMJ = (r.fuelConsumption || 0) * MJ_PER_TON;
    const cb_g = (target - r.ghgIntensity) * energyMJ; // grams
    return {
      routeId: r.routeId,
      ghgIntensity: r.ghgIntensity,
      fuelTons: r.fuelConsumption,
      energyMJ,
      cb_g,
    };
  });

  const total_g = components.reduce((s, c) => s + c.cb_g, 0);

  return {
    shipId,
    year,
    cb_g: total_g,
    cb_t: total_g / 1_000_000, // tonnes (since cb_g is grams, 1e6 g = 1 t)
    components,
    computedAt: new Date().toISOString(),
  };
}
