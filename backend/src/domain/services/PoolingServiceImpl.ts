import { PoolingService } from "../ports/inbound/PoolingService";
import { PoolRepository } from "../ports/outbound/PoolRepository";
import { RouteRepository } from "../ports/outbound/RouteRepository";
import { BankEntryRepository } from "../ports/outbound/BankEntryRepository";
import { Pool } from "../entities/Pool";
import { ComplianceServiceImpl } from "./ComplianceServiceImpl";

/**
 * Pooling Service Implementation
 * Implements Article 21 - Pooling use cases
 */
export class PoolingServiceImpl implements PoolingService {
  constructor(
    private readonly poolRepository: PoolRepository,
    private readonly routeRepository: RouteRepository,
    private readonly bankEntryRepository: BankEntryRepository
  ) {}

  async createPool(year: number, memberShipIds: string[]): Promise<Pool> {
    if (memberShipIds.length === 0) {
      throw new Error("Pool must have at least one member");
    }

    // Get CB for each member ship
    const complianceService = new ComplianceServiceImpl(
      this.routeRepository,
      this.bankEntryRepository
    );

    const members: Array<{ shipId: string; cbBeforeGrams: number }> = [];

    for (const shipId of memberShipIds) {
      try {
        const shipCompliance = await complianceService.computeComplianceBalance(shipId, year);
        members.push({
          shipId,
          cbBeforeGrams: shipCompliance.getComplianceBalanceGrams().getValue(),
        });
      } catch (error) {
        throw new Error(`Failed to get compliance balance for ship ${shipId}: ${error}`);
      }
    }

    // Create pool (will apply greedy allocation automatically)
    const pool = Pool.create({
      id: `P-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      year,
      members,
    });

    // Persist pool
    return this.poolRepository.create(pool);
  }

  async getPoolById(poolId: string): Promise<Pool | null> {
    return this.poolRepository.findById(poolId);
  }

  async getPoolsByYear(year: number): Promise<Pool[]> {
    return this.poolRepository.findByYear(year);
  }
}
