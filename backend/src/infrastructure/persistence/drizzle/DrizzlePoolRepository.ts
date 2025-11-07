import { PoolRepository } from "../../../domain/ports/outbound/PoolRepository";
import { Pool } from "../../../domain/entities/Pool";
import { db } from "../../../db";
import { pools, poolMembers } from "../../../db/schema";
import { eq } from "drizzle-orm";

/**
 * Drizzle Pool Repository Implementation
 * Implements pool persistence using Drizzle ORM + Postgres
 */
export class DrizzlePoolRepository implements PoolRepository {
  async findById(poolId: string): Promise<Pool | null> {
    const [poolRow] = await db.select().from(pools).where(eq(pools.id, Number(poolId)));

    if (!poolRow) return null;

    const memberRows = await db
      .select()
      .from(poolMembers)
      .where(eq(poolMembers.poolId, Number(poolId)));

    return this.toDomain(poolRow, memberRows);
  }

  async findByYear(year: number): Promise<Pool[]> {
    const poolRows = await db.select().from(pools).where(eq(pools.year, year));

    const result: Pool[] = [];
    for (const poolRow of poolRows) {
      const memberRows = await db
        .select()
        .from(poolMembers)
        .where(eq(poolMembers.poolId, poolRow.id));

      result.push(this.toDomain(poolRow, memberRows));
    }

    return result;
  }

  async create(pool: Pool): Promise<Pool> {
    const plain = pool.toPlainObject();

    // Create pool record (poolSum is calculated from members, not stored)
    const [poolRow] = await db
      .insert(pools)
      .values({
        year: plain.year,
      })
      .returning();

    // Create member records
    for (const member of plain.members) {
      await db.insert(poolMembers).values({
        poolId: poolRow.id,
        shipId: member.shipId,
        cbBeforeG: String(member.cb_before_g),
        cbAfterG: String(member.cb_after_g),
      });
    }

    // Fetch complete pool with members
    return (await this.findById(String(poolRow.id)))!;
  }

  async findAll(): Promise<Pool[]> {
    const poolRows = await db.select().from(pools);

    const result: Pool[] = [];
    for (const poolRow of poolRows) {
      const memberRows = await db
        .select()
        .from(poolMembers)
        .where(eq(poolMembers.poolId, poolRow.id));

      result.push(this.toDomain(poolRow, memberRows));
    }

    return result;
  }

  /**
   * Convert database rows to domain entity
   */
  private toDomain(poolRow: any, memberRows: any[]): Pool {
    return Pool.create({
      id: String(poolRow.id),
      year: poolRow.year,
      members: memberRows.map((m) => ({
        shipId: m.shipId,
        cbBeforeGrams: Number(m.cbBeforeG),
      })),
      createdAt: poolRow.createdAt ? new Date(poolRow.createdAt) : undefined,
    });
  }
}
