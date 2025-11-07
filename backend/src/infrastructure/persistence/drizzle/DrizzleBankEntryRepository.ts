import { BankEntryRepository } from "../../../domain/ports/outbound/BankEntryRepository";
import { BankEntry } from "../../../domain/entities/BankEntry";
import { db } from "../../../db";
import { bankEntries } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Drizzle Bank Entry Repository Implementation
 * Implements banking persistence using Drizzle ORM + Postgres
 */
export class DrizzleBankEntryRepository implements BankEntryRepository {
  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const result = await db
      .select()
      .from(bankEntries)
      .where(and(eq(bankEntries.shipId, shipId), eq(bankEntries.year, year)));

    return result.map(this.toDomain);
  }

  async findById(id: string): Promise<BankEntry | null> {
    const [result] = await db.select().from(bankEntries).where(eq(bankEntries.id, Number(id)));
    return result ? this.toDomain(result) : null;
  }

  async create(entry: BankEntry): Promise<BankEntry> {
    const plain = entry.toPlainObject();

    const [created] = await db
      .insert(bankEntries)
      .values({
        shipId: plain.shipId,
        year: plain.year,
        amountG: String(plain.amount_g),
        type: plain.type,
      })
      .returning();

    return this.toDomain(created);
  }

  async findAll(): Promise<BankEntry[]> {
    const result = await db.select().from(bankEntries);
    return result.map(this.toDomain);
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: any): BankEntry {
    return BankEntry.create({
      id: String(row.id),
      shipId: row.shipId,
      year: row.year,
      amountGrams: Number(row.amountG),
      type: row.type as "bank" | "apply",
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
    });
  }
}
