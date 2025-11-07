import { BankEntryRepository } from "../../../domain/ports/outbound/BankEntryRepository";
import { BankEntry } from "../../../domain/entities/BankEntry";

/**
 * In-Memory Bank Entry Repository Implementation
 * For testing and development without database
 */
export class InMemoryBankEntryRepository implements BankEntryRepository {
  private entries: BankEntry[] = [];

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    return this.entries.filter(
      (e) => e.getShipId() === shipId && e.getYear().getValue() === year
    );
  }

  async findById(id: string): Promise<BankEntry | null> {
    return this.entries.find((e) => e.getId() === id) || null;
  }

  async create(entry: BankEntry): Promise<BankEntry> {
    this.entries.push(entry);
    return entry;
  }

  async findAll(): Promise<BankEntry[]> {
    return this.entries;
  }
}
