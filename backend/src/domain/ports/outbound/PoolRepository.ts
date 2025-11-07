import { Pool } from "../../entities/Pool";

/**
 * Pool Repository Port (Outbound)
 * Contract for pool data persistence
 */
export interface PoolRepository {
  /**
   * Find a pool by ID
   */
  findById(poolId: string): Promise<Pool | null>;

  /**
   * Find all pools for a specific year
   */
  findByYear(year: number): Promise<Pool[]>;

  /**
   * Create a new pool
   */
  create(pool: Pool): Promise<Pool>;

  /**
   * Find all pools (optional - for admin)
   */
  findAll(): Promise<Pool[]>;
}
