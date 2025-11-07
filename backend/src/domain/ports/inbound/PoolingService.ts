import { Pool } from "../../entities/Pool";

/**
 * Pooling Service Port (Inbound)
 * Defines use cases for Article 21 - Pooling
 */

export interface PoolingService {
  /**
   * Create a compliance pool for multiple ships
   * Business rules:
   * - Pool sum must be >= 0
   * - Applies greedy allocation algorithm automatically
   */
  createPool(year: number, memberShipIds: string[]): Promise<Pool>;

  /**
   * Get pool by ID
   */
  getPoolById(poolId: string): Promise<Pool | null>;

  /**
   * Get all pools for a specific year
   */
  getPoolsByYear(year: number): Promise<Pool[]>;
}
