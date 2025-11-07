import { Pool } from "../../../../domain/entities/Pool";

/**
 * Pool Data Transfer Object
 */
export class PoolDTO {
  static fromDomain(pool: Pool) {
    const plain = pool.toPlainObject();
    return {
      year: plain.year,
      poolSum: plain.poolSum,
      members: plain.members,
      createdAt: plain.createdAt,
    };
  }
}
