import { ComplianceService } from "../ports/inbound/ComplianceService";
import { RouteRepository } from "../ports/outbound/RouteRepository";
import { BankEntryRepository } from "../ports/outbound/BankEntryRepository";
import { ShipComplianceBalance, ComplianceComponent } from "../entities/Ship";
import { GHGIntensity } from "../valueObjects/GHGIntensity";
import { Year } from "../valueObjects/Year";
import { ComplianceBalanceGrams } from "../valueObjects/ComplianceBalanceGrams";

/**
 * Compliance Service Implementation
 * Implements compliance calculation use cases
 */
export class ComplianceServiceImpl implements ComplianceService {
  // FuelEU Target: 89.3368 gCO₂e/MJ (2% below 91.16)
  private static readonly TARGET_INTENSITY = GHGIntensity.create(89.3368);

  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly bankEntryRepository: BankEntryRepository
  ) {}

  async computeComplianceBalance(shipId: string, year: number): Promise<ShipComplianceBalance> {
    // Get all routes for this ship and year
    const routes = await this.routeRepository.findByShipAndYear(shipId, year);

    if (routes.length === 0) {
      throw new Error(`No routes found for ship ${shipId} in year ${year}`);
    }

    // Calculate CB for each route
    const components: ComplianceComponent[] = [];
    let totalCB = ComplianceBalanceGrams.zero();

    for (const route of routes) {
      const cb = route.calculateComplianceBalance(ComplianceServiceImpl.TARGET_INTENSITY);
      const energy = route.getEnergy();

      components.push(
        new ComplianceComponent(
          route.getRouteId(),
          route.getGHGIntensity().getValue(),
          route.getFuelConsumptionTonnes(),
          energy.getValue(),
          cb
        )
      );

      totalCB = totalCB.add(cb);
    }

    // Create ship compliance balance
    return ShipComplianceBalance.create({
      shipId,
      year,
      complianceBalanceGrams: totalCB.getValue(),
      components: components.map(c => c.toPlainObject()),
    });
  }

  async getAdjustedComplianceBalance(
    shipId: string,
    year: number
  ): Promise<{
    shipCompliance: ShipComplianceBalance;
    totalBanked: number;
    totalApplied: number;
    adjusted_g: number;
  }> {
    // Get computed CB
    const shipCompliance = await this.computeComplianceBalance(shipId, year);

    // Get banking entries
    const bankEntries = await this.bankEntryRepository.findByShipAndYear(shipId, year);

    // Calculate banking totals
    const yearObj = Year.create(year);
    let totalBanked = 0;
    let totalApplied = 0;

    for (const entry of bankEntries) {
      if (entry.getYear().equals(yearObj)) {
        if (entry.getType() === "bank") {
          totalBanked += entry.getAmountGrams().getValue();
        } else if (entry.getType() === "apply") {
          totalApplied += entry.getAmountGrams().getValue();
        }
      }
    }

    // Calculate adjusted CB
    // CB_adjusted = CB_computed - banked + applied
    const adjusted_g = shipCompliance.getComplianceBalanceGrams().getValue() - totalBanked + totalApplied;

    return {
      shipCompliance,
      totalBanked,
      totalApplied,
      adjusted_g,
    };
  }
}
