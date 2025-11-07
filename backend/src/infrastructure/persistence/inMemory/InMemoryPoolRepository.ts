import { PoolRepository } from "../../../domain/ports/outbound/PoolRepository";
import { Pool } from "../../../domain/entities/Pool";

/**
 * In-Memory Pool Repository Implementation
 * For testing and development without database
 */
export class InMemoryPoolRepository implements PoolRepository {
  private pools: Pool[] = [];

  async findById(poolId: string): Promise<Pool | null> {
    return this.pools.find((p) => p.getId() === poolId) || null;
  }

  async findByYear(year: number): Promise<Pool[]> {
    return this.pools.filter((p) => p.getYear().getValue() === year);
  }

  async create(pool: Pool): Promise<Pool> {
    this.pools.push(pool);
    return pool;
  }

  async findAll(): Promise<Pool[]> {
    return this.pools;
  }
}
