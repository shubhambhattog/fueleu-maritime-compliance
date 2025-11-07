import { ShipComplianceBalance } from "../../entities/Ship";

/**
 * Compliance Service Port (Inbound)
 * Defines use cases for compliance balance calculations
 */

export interface ComplianceService {
  /**
   * Compute compliance balance for a ship in a specific year
   * Aggregates all routes for that ship/year
   */
  computeComplianceBalance(shipId: string, year: number): Promise<ShipComplianceBalance>;

  /**
   * Get adjusted compliance balance after banking operations
   * CB_adjusted = CB_computed - total_banked + total_applied
   */
  getAdjustedComplianceBalance(shipId: string, year: number): Promise<{
    shipCompliance: ShipComplianceBalance;
    totalBanked: number;
    totalApplied: number;
    adjusted_g: number;
  }>;
}
